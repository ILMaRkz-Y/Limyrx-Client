import type { FastifyInstance } from 'fastify'
import { Device, Event, Player, Session } from '../db/models'

interface HeartbeatBody {
    deviceId: string
    launcherVersion?: string
    os?: string
    username?: string
}

/**
 * `POST /api/v1/heartbeat`
 *
 * Called by the launcher on startup, on every game launch and every 2 minutes
 * while it runs. Upserts the device, records a heartbeat event, keeps the
 * active session alive and links the (consented) Minecraft username.
 */
export async function heartbeatRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: HeartbeatBody }>('/heartbeat', async (req, reply) => {
        const { deviceId, launcherVersion, os, username } = req.body ?? {}
        if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) {
            return reply.code(400).send({ error: 'deviceId is required' })
        }

        const now = new Date()
        const normalizedUsername =
            typeof username === 'string' && username.trim() ? username.trim().toLowerCase() : undefined

        const result = await Device.findOneAndUpdate(
            { deviceId },
            {
                $set: { lastSeen: now },
                $min: { firstSeen: now },
                ...(launcherVersion ? { $set: { launcherVersion } } : {}),
                ...(os ? { $set: { os } } : {}),
            },
            { upsert: true, setDefaultsOnInsert: true, new: true },
        )
        if (!result) {
            return reply.code(500).send({ error: 'failed to upsert device' })
        }

        if (normalizedUsername) {
            const existing = await Player.findOneAndUpdate(
                { username: normalizedUsername },
                {
                    $set: { lastSeen: now },
                    $min: { firstSeen: now },
                    $addToSet: { deviceIds: deviceId },
                },
                { upsert: true, new: true },
            )
            if (!existing) {
                return reply.code(500).send({ error: 'failed to upsert player' })
            }
        }

        // Keep the current session alive. A session = one launcher run.
        await Session.updateOne(
            { deviceId, endedAt: null },
            { $set: { lastHeartbeat: now }, ...(normalizedUsername ? { $set: { username: normalizedUsername } } : {}) },
        )
        const active = await Session.findOneAndUpdate(
            { deviceId, endedAt: null },
            { $set: { startedAt: now, lastHeartbeat: now } },
            { upsert: true, new: true },
        )
        if (!active) {
            return reply.code(500).send({ error: 'failed to upsert session' })
        }

        // One lightweight event per heartbeat — the source for the admin
        // timeseries buckets (distinct devices + event volume per bucket).
        await Event.create({ deviceId, type: 'heartbeat', at: now })

        return { ok: true }
    })
}
