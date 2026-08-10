import mongoose from 'mongoose'

/**
 * Device — one launcher installation. Identified by an anonymous UUID the
 * launcher persists in its data dir.
 */
const deviceSchema = new mongoose.Schema(
    {
        deviceId: { type: String, required: true, unique: true, index: true },
        firstSeen: { type: Date, required: true },
        lastSeen: { type: Date, required: true, index: true },
        launcherVersion: { type: String },
        os: { type: String },
        country: { type: String },
    },
    { timestamps: false },
)

/**
 * Session — one launcher run (deviceId -> now). "Online now" is derived from
 * sessions whose lastHeartbeat is fresher than the online window.
 */
const sessionSchema = new mongoose.Schema(
    {
        deviceId: { type: String, required: true, index: true },
        username: { type: String, index: true },
        startedAt: { type: Date, required: true },
        lastHeartbeat: { type: Date, required: true, index: true },
        endedAt: { type: Date },
        launches: [
            {
                at: { type: Date, required: true },
                mcVersion: String,
                type: { type: String },
            },
        ],
    },
    { timestamps: false },
)
sessionSchema.index({ deviceId: 1, startedAt: -1 })

/**
 * Player — a Minecraft username that consented to telemetry. Normalized to
 * lowercase so it stays searchable; usernames are public on servers, and the
 * data only lives in the private admin DB. (Revisit: hashed storage would
 * break the players table search.)
 */
const playerSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true },
        deviceIds: [{ type: String }],
        firstSeen: { type: Date, required: true },
        lastSeen: { type: Date, required: true, index: true },
    },
    { timestamps: false },
)

/** Discrete events reported by the launcher (update installed, game launch...). */
const eventSchema = new mongoose.Schema(
    {
        deviceId: { type: String, required: true, index: true },
        type: { type: String, required: true },
        at: { type: Date, required: true, index: true },
        data: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: false },
)
eventSchema.index({ type: 1, at: -1 })

/** Admin account for the dashboard. */
const adminSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['owner', 'admin'], default: 'admin' },
        createdAt: { type: Date, default: () => new Date() },
    },
    { timestamps: false },
)

/** Future: message pushed to launchers from the dashboard. */
const broadcastSchema = new mongoose.Schema(
    {
        message: { type: String, required: true },
        targetVersion: { type: String },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: () => new Date() },
    },
    { timestamps: false },
)

export const Device = mongoose.model('Device', deviceSchema)
export const Session = mongoose.model('Session', sessionSchema)
export const Player = mongoose.model('Player', playerSchema)
export const Event = mongoose.model('Event', eventSchema)
export const Admin = mongoose.model('Admin', adminSchema)
export const Broadcast = mongoose.model('Broadcast', broadcastSchema)

export async function connectMongo(uri: string): Promise<void> {
    await mongoose.connect(uri, {
        // Uniqueness of devices/players is guaranteed at the app level; no
        // need to spawn a replica set for single-node dev/prod.
        serverSelectionTimeoutMS: 5000,
    })
}
