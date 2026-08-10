import cors from '@fastify/cors'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { authPlugin } from './auth/auth'
import { config } from './config'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { eventRoutes } from './routes/events'
import { heartbeatRoutes } from './routes/heartbeat'
import { installRoutes } from './routes/install'
import { publicRoutes } from './routes/public'

/**
 * Build the Fastify app. Separate from the entry point so tests can boot an
 * in-process instance without listening on a port.
 */
export async function createApp(): Promise<FastifyInstance> {
    const app = Fastify({ logger: true })
    await app.register(cors, { origin: config.corsOrigin })

    await app.register(authPlugin)

    app.get('/health', async () => ({ ok: true, uptime: process.uptime() }))

    await app.register(publicRoutes, { prefix: '/api/v1' })
    await app.register(authRoutes, { prefix: '/api/v1' })
    await app.register(heartbeatRoutes, { prefix: '/api/v1' })
    await app.register(installRoutes, { prefix: '/api/v1' })
    await app.register(eventRoutes, { prefix: '/api/v1' })
    await app.register(adminRoutes, { prefix: '/api/v1/admin' })

    app.setErrorHandler((err: FastifyError, _req, reply) => {
        app.log.error(err)
        reply.code(err.statusCode ?? 500).send({ error: err.message })
    })

    return app
}
