import { randomBytes } from 'crypto'
import os from 'os'
import { ensureDir, pathExists, readJson, writeJson } from 'fs-extra'
import {
  type LimyrxEventPayload,
  type LimyrxFirstInstallPayload,
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
 * Limyrx telemetry.
 *
 * A minimal, anonymous heartbeat (device id + launcher version + OS) is always
 * sent on startup and every two minutes so the dashboard can count installs
 * and "online now" accurately. The Minecraft username and game events are only
 * sent while the user enabled `enableLimyrxMetrics` — that toggle is the
 * consent for the personally identifiable part of the metrics. On the very
 * first run a one-off `first-install` ping triggers the Discord notification.
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
      const isFirstRun = await this.loadDeviceId()
      if (isFirstRun) {
        this.reportFirstInstall().catch(() => { })
      }

      // Anonymous heartbeat runs always (one ping on startup + every 2 min)
      // so the dashboard can count real online users. The Minecraft username
      // is only attached while `enableLimyrxMetrics` is enabled.
      await this.start()

      this.settings.subscribe('enableLimyrxMetricsSet', async (enabled) => {
        if (enabled) {
          await this.heartbeat().catch(() => { })
        }
      })

      this.launchService.on('minecraft-start', ({ minecraft }) => {
        this.reportEvent('game_launch', { minecraft }).catch(() => { })
      })
      this.launchService.on('minecraft-exit', ({ code }) => {
        this.reportEvent('game_exit', { code }).catch(() => { })
      })
    })
  }

  get consented(): boolean {
    return !isE2E() && !!this.deviceId && this.settings.enableLimyrxMetrics
  }

  async heartbeat(): Promise<void> {
    if (isE2E() || !this.deviceId) return
    const payload: LimyrxHeartbeatPayload = {
      deviceId: this.deviceId,
      launcherVersion: this.app.version,
      os: process.platform,
    }
    if (this.settings.enableLimyrxMetrics) {
      const username = await this.getUsername()
      if (username) payload.username = username
    }
    await this.post('/heartbeat', payload)
  }

  async reportEvent(type: string, data?: Record<string, unknown>): Promise<void> {
    if (!this.consented) return
    const payload: LimyrxEventPayload = { deviceId: this.deviceId, type, data }
    await this.post('/event', payload)
  }

  async reportFirstInstall(): Promise<void> {
    if (isE2E() || !this.deviceId) return
    const payload: LimyrxFirstInstallPayload = {
      deviceId: this.deviceId,
      launcherVersion: this.app.version,
      os: process.platform,
    }
    try {
      payload.username = os.userInfo().username
    } catch (e) {
      void e
    }
    await this.post('/first-install', payload)
  }

  private async start(): Promise<void> {
    if (this.started || isE2E()) return
    this.started = true
    await this.heartbeat().catch(() => { })
    this.timer = setInterval(() => {
      this.heartbeat().catch(() => { })
    }, HEARTBEAT_INTERVAL_MS)
  }

  /**
   * Load the persisted install id, creating and storing a random one on
   * first run. The id is what lets the dashboard count installs and
   * "online now" without any login. Returns true when this is the very
   * first run on this machine (a fresh id was created).
   */
  private async loadDeviceId(): Promise<boolean> {
    const file = this.getAppDataPath(DEVICE_FILE)
    try {
      if (await pathExists(file)) {
        const data = (await readJson(file)) as { deviceId?: string }
        if (typeof data.deviceId === 'string' && data.deviceId.length > 0) {
          this.deviceId = data.deviceId
          return false
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
    return true
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
