import dotenv from 'dotenv'

dotenv.config()

export interface Config {
    /** MongoDB connection string. */
    mongoUri: string
    /** Port the API listens on (inside Docker: 3000). */
    port: number
    /** JWT signing secret for admin sessions. */
    jwtSecret: string
    /** Env token required to bootstrap the first admin (no admins exist yet). */
    adminBootstrapToken: string | undefined
    /** GitHub repository `owner/repo` for release download counts. */
    githubRepo: string
    /** Optional GitHub token (avoids rate limits on the releases API). */
    githubToken: string | undefined
    /** "Online now" window in ms (heartbeat fresher than this counts). */
    onlineWindowMs: number
    /** In-memory cache TTL for GitHub download counts. */
    githubCacheMs: number
    /** Origin allowed by CORS (launcher + dashboard). '*' allows all. */
    corsOrigin: string
    /** Discord webhook URL for new-install notifications. Optional. */
    discordWebhookUrl: string | undefined
}

function intEnv(name: string, fallback: number): number {
    const raw = process.env[name]
    if (!raw) return fallback
    const n = Number.parseInt(raw, 10)
    return Number.isNaN(n) ? fallback : n
}

export const config: Config = {
    mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/limyrx',
    port: intEnv('PORT', 3000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN,
    githubRepo: process.env.GITHUB_REPO ?? 'ILMaRkz-Y/Limyrx-Client',
    githubToken: process.env.GITHUB_TOKEN,
    onlineWindowMs: intEnv('ONLINE_WINDOW_MS', 2 * 60 * 1000),
    githubCacheMs: intEnv('GITHUB_CACHE_MS', 5 * 60 * 1000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
}
