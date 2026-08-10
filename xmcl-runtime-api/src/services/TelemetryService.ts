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
 * Anonymous, opt-in analytics for the Limyrx stats dashboard. Everything is
 * OFF by default and only sends while the `enableLimyrxMetrics` setting is
 * on. The single setting doubles as the user's consent — no data (including
 * the Minecraft username) leaves the device without it.
 */
export interface TelemetryService {
  /**
   * True while metrics are enabled, the device id exists and the service is
   * not disabled by an E2E run.
   */
  readonly consented: boolean
  /**
   * Send a heartbeat immediately (independent of the 2-minute timer).
   */
  heartbeat(): Promise<void>
  /**
   * Report a discrete event (e.g. `game_launch`). No-op when not consented.
   */
  reportEvent(type: string, data?: Record<string, unknown>): Promise<void>
}

export const TelemetryServiceKey: ServiceKey<TelemetryService> = 'TelemetryService'
