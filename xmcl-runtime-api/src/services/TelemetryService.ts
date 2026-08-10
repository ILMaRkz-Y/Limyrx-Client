import type { ServiceKey } from './Service'

/**
 * Payload sent to the Limyrx Stats API heartbeat endpoint
 * (POST /api/v1/heartbeat).
 */
export interface LimyrxHeartbeatPayload {
  /**
   * Random id persisted per launcher install. Stable across restarts so the
   * stats API can count installs and "online now" without a login.
   */
  deviceId: string
  /** Launcher version, e.g. `0.64.7`. */
  launcherVersion: string
  /** `process.platform`, e.g. `win32`. */
  os: string
  /**
   * Minecraft username. Only attached when the user opted into metrics —
   * it is the personally identifiable part of the payload.
   */
  username?: string
}

/**
 * Payload sent to the Limyrx Stats API event endpoint
 * (POST /api/v1/event).
 */
export interface LimyrxEventPayload {
  deviceId: string
  /** Event type, e.g. `game_launch`. */
  type: string
  data?: Record<string, unknown>
}

/**
 * Payload sent to the Limyrx Stats API first-install endpoint
 * (POST /api/v1/first-install). Sent once per machine on first launcher run,
 * regardless of the metrics consent toggle.
 */
export interface LimyrxFirstInstallPayload {
  deviceId: string
  /** Launcher version, e.g. `0.64.7`. */
  launcherVersion: string
  /** `process.platform`, e.g. `win32`. */
  os: string
  /**
   * Operating-system account name (e.g. the Windows username). Shared on
   * first run so the install webhook can greet the user.
   */
  username?: string
}

/**
 * Limyrx analytics.
 *
 * A minimal anonymous heartbeat (device id, launcher version, OS) is always
 * sent so the dashboard can count real `online now` and installs. The
 * Minecraft username and game event reporting are opt-in and controlled by the
 * `enableLimyrxMetrics` setting.
 */
export interface TelemetryService {
  /**
   * True while detailed metrics are enabled (username + game events), the
   * device id exists and the service is not disabled by an E2E run.
   */
  readonly consented: boolean
  /**
   * Send a heartbeat immediately (independent of the 2-minute timer). Always
   * sends the anonymous part; the username only when `consented`.
   */
  heartbeat(): Promise<void>
  /**
   * Report a discrete event (e.g. `game_launch`). No-op when not consented.
   */
  reportEvent(type: string, data?: Record<string, unknown>): Promise<void>
  /**
   * Report a first-launch install (one per machine, always sent).
   */
  reportFirstInstall(): Promise<void>
}

export const TelemetryServiceKey: ServiceKey<TelemetryService> = 'TelemetryService'
