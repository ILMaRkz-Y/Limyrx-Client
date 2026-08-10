import type { FastifyInstance } from 'fastify'
import { Event, Session } from '../db/models'

const EVENT_TYPES = new Set(['update_installed', 'game_launch', 'crash', 'error', 'heartbeat'])

interface EventBody {
    deviceId: string
    type: string
    at?: string
    data?: Record<string, unknown>
}

/**
 * `POST /api/v1/event`
 *
 * Discrete launcher events (update installed, game launched, crash...).
 */
export async function eventRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: EventBody }>('/event', async (req, reply) => {
        const { deviceId, type, at, data } = req.body ?? {}
        if (!deviceId || typeof deviceId !== 'string' || !type || typeof type !== 'string') {
            return reply.code(400).send({ error: 'deviceId and type are required' })
        }
        if (!EVENT_TYPES.has(type)) {
            return reply.code(400).send({ error: `unknown event type: ${type}` })
        }
        const timestamp = at ? new Date(at) : new Date()
        if (Number.isNaN(timestamp.getTime())) {
            return reply.code(400).send({ error: 'invalid `at` timestamp' })
        }

        await Event.create({ deviceId, type, at: timestamp, data: data ?? {} })

        if (type === 'game_launch' && data?.mcVersion) {
            await Session.updateOne(
                { deviceId, endedAt: null },
                { $push: { launches: { at: timestamp, mcVersion: String(data.mcVersion), type: data.type ?? '' } } },
            )
        }
        return { ok: true }
    })
}
