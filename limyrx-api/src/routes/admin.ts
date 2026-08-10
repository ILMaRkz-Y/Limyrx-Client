import type { FastifyInstance } from 'fastify'
import { getOverview, getTimeseries } from '../stats'
import { getReleaseDownloads } from '../github'
import { Broadcast, Player } from '../db/models'

interface PlayersQuery {
    q?: string
    sort?: 'lastSeen' | 'firstSeen'
    limit?: string
    offset?: string
}

interface BroadcastBody {
    message: string
    targetVersion?: string
    active?: boolean
}

/**
 * Admin-only routes. Mounted under `/api/v1/admin` behind `authenticate`
 * (JWT). Owner-only endpoints additionally use `requireOwner`.
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', app.authenticate)

    app.get('/stats/overview', async () => getOverview())

    app.get<{ Querystring: { range?: '24h' | '7d' | '30d' } }>('/stats/timeseries', async (req) => {
        const range = req.query?.range ?? '24h'
        if (!['24h', '7d', '30d'].includes(range)) {
            return { error: 'range must be one of 24h, 7d, 30d' }
        }
        return getTimeseries(range)
    })

    app.get<{ Querystring: PlayersQuery }>('/players', async (req, reply) => {
        const q = req.query?.q?.trim().toLowerCase()
        const sort = req.query?.sort === 'firstSeen' ? 'firstSeen' : 'lastSeen'
        const limit = Math.min(Number.parseInt(req.query?.limit ?? '50', 10) || 50, 200)
        const offset = Math.max(Number.parseInt(req.query?.offset ?? '0', 10) || 0, 0)
        const filter = q ? { username: { $regex: q, $options: 'i' } } : {}
        const [total, players] = await Promise.all([
            Player.countDocuments(filter),
            Player.find(filter).sort({ [sort]: -1 }).skip(offset).limit(limit).lean(),
        ])
        return { total, offset, limit, players }
    })

    app.get('/releases', async () => getReleaseDownloads())

    app.post<{ Body: BroadcastBody }>('/broadcast', async (req, reply) => {
        const { message, targetVersion, active } = req.body ?? {}
        if (!message || typeof message !== 'string') {
            return reply.code(400).send({ error: 'message is required' })
        }
        const broadcast = await Broadcast.create({
            message,
            targetVersion: targetVersion ?? null,
            active: active ?? true,
        })
        return broadcast
    })

    app.get('/broadcasts', async () =>
        Broadcast.find().sort({ createdAt: -1 }).limit(50).lean(),
    )
}
