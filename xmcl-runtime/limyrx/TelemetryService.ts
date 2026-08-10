import { randomBytes } from 'crypto'
import { ensureDir, pathExists, readJson, writeJson } from 'fs-extra'
import {
  type LimyrxEventPayload,
  type LimyrxHeartbeatPayload,
  type Settings,
  type SharedState,
  type TelemetryService as ITelemetryService,
  TelemetryServiceKey,
} from '@xmcl/runtime-api'
import { Inject, LauncherApp, LauncherAppKey } from '~/app'
import { AbstractService, ExposeServiceKey } from '~/service'
import { kSettings } from '~/settings'
import { LaunchService } from '../launch/LaunchService'
import { UserService } from '../user/UserService'

/**
 * Base URL of the Limyrx Stats API. Overridable for local development.
 */
const API_BASE = process.env.LIMYRX_API_BASE || 'https://api.limyrx.online/api/v1'
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000
const DEVICE_FILE = 'telemetry-device.json'

function isE2E() {
  return Object.keys(process.env).some((key) => key.startsWith('XMCL_E2E'))
}

/**
 * Anonymous, opt-in telemetry for the Limyrx stats dashboard.
 *
 * Nothing is sent while `enableLimyrxMetrics` is off (the default). When the
 * user opts in, the launcher reports a heartbeat every two minutes and emits
 * game launch/exit events. The only potentially identifiable field — the
 * Minecraft username — is derived from the user state and included solely
 * because the user turned the toggle on.
 */
@ExposeServiceKey(TelemetryServiceKey)
export class TelemetryService extends AbstractService implements ITelemetryService {
  private deviceId = ''
  private timer: NodeJS.Timeout | undefined
  private started = false

  constructor(
    @Inject(LauncherAppKey) app: LauncherApp,
    @Inject(kSettings) private settings: SharedState<Settings>,
    @Inject(UserService) private userService: UserService,
    @Inject(LaunchService) private launchService: LaunchService,
  ) {
    super(app, async () => {
      await this.loadDeviceId()

      this.settings.subscribe('enableLimyrxMetricsSet', async (enabled) => {
        if (enabled) {
          await this.start()
        } else {
          this.stop()
        }
      })

      this.launchService.on('minecraft-start', ({ minecraft }) => {
        this.reportEvent('game_launch', { minecraft }).catch(() => { })
      })
      this.launchService.on('minecraft-exit', ({ code }) => {
        this.reportEvent('game_exit', { code }).catch(() => { })
      })

      if (this.settings.enableLimyrxMetrics) {
        await this.start()
      }
    })
  }

  get consented(): boolean {
    return !isE2E() && !!this.deviceId && this.settings.enableLimyrxMetrics
  }

  async heartbeat(): Promise<void> {
    if (!this.consented) return
    const payload: LimyrxHeartbeatPayload = {
      deviceId: this.deviceId,
      launcherVersion: this.app.version,
      os: process.platform,
    }
    const username = await this.getUsername()
    if (username) payload.username = username
    await this.post('/heartbeat', payload)
  }

  async reportEvent(type: string, data?: Record<string, unknown>): Promise<void> {
    if (!this.consented) return
    const payload: LimyrxEventPayload = { deviceId: this.deviceId, type, data }
    await this.post('/event', payload)
  }

  private async start(): Promise<void> {
    if (this.started) return
    this.started = true
    await this.heartbeat().catch(() => { })
    this.timer = setInterval(() => {
      this.heartbeat().catch(() => { })
    }, HEARTBEAT_INTERVAL_MS)
  }

  private stop(): void {
    this.started = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  /**
   * Load the persisted install id, creating and storing a random one on
   * first run. The id is what lets the dashboard count installs and
   * "online now" without any login.
   */
  private async loadDeviceId(): Promise<void> {
    const file = this.getAppDataPath(DEVICE_FILE)
    try {
      if (await pathExists(file)) {
        const data = (await readJson(file)) as { deviceId?: string }
        if (typeof data.deviceId === 'string' && data.deviceId.length > 0) {
          this.deviceId = data.deviceId
          return
        }
      }
    } catch (e) {
      this.warn('Fail to read telemetry device id')
      this.warn(e)
    }
    this.deviceId = randomBytes(16).toString('hex')
    try {
      await ensureDir(this.app.appDataPath)
      await writeJson(file, { deviceId: this.deviceId })
    } catch (e) {
      this.warn('Fail to persist telemetry device id')
      this.warn(e)
    }
  }

  /**
   * Resolve the current Minecraft username from the user state. The username
   * is the only potentially identifiable field the launcher ever sends and it
   * is gated behind the same opt-in consent as the rest of the metrics.
   */
  private async getUsername(): Promise<string | undefined> {
    try {
      const state = await this.userService.getUserState()
      const user = Object.values(state.users).find((u) => !u.invalidated)
      if (!user) return undefined
      const profile = user.profiles[user.selectedProfile] || Object.values(user.profiles)[0]
      return profile?.name
    } catch (e) {
      this.warn('Fail to resolve Minecraft username for telemetry')
      this.warn(e)
      return undefined
    }
  }

  private async post(path: string, body: unknown): Promise<void> {
    try {
      const resp = await this.app.fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        this.warn(`[Limyrx] Telemetry ${path} failed: HTTP ${resp.status}`)
      }
    } catch (e) {
      this.warn(`[Limyrx] Telemetry ${path} failed`)
      this.warn(e)
    }
  }
}
