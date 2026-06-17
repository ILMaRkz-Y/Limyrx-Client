/**
 * A single game play session
 */
export interface GameSession {
  /** Unix timestamp (ms) when the game started */
  startTime: number
  /** Unix timestamp (ms) when the game ended */
  endTime: number
  /** Duration in milliseconds */
  duration: number
  /** Minecraft version played */
  minecraftVersion: string
  /** Exit code (0 = clean exit) */
  exitCode?: number
}

/**
 * Collection of sessions for an instance, stored as sessions.json
 */
export interface GameSessionCollection {
  sessions: GameSession[]
}

export const SESSIONS_FILE = 'sessions.json'
