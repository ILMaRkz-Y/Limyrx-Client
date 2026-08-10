import type { FastifyInstance } from 'fastify'
import { getReleaseDownloads, getTotalDownloads } from '../github'
import { countOnlineNow } from '../stats'
import { Device } from '../db/models'

/**
 * Public (unauthenticated) endpoints — consumed by the launcher itself and
 * anyone who wants to embed "downloads / online" stats.
 */
export async function publicRoutes(app: FastifyInstance): Promise<void> {
    app.get('/stats/public', async () => {
        const [totalDownloads, onlineNow, installs, releases] = await Promise.all([
            getTotalDownloads().catch(() => 0),
            countOnlineNow(),
            Device.countDocuments(),
            getReleaseDownloads().catch(() => []),
        ])
        return {
            downloads: { total: totalDownloads, perRelease: releases },
            onlineNow,
            installs,
        }
    })

    app.get('/releases', async () => getReleaseDownloads())
}
