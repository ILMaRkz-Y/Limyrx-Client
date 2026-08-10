import fastifyJwt from '@fastify/jwt'
import bcrypt from 'bcryptjs'
import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../config'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; email: string; role: 'owner' | 'admin' }
        user: { sub: string; email: string; role: 'owner' | 'admin' }
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        /** Require a valid admin JWT on the request. */
        authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
        /** Require a valid admin JWT with the `owner` role. */
        requireOwner: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
}

/** Hash a password for storage. */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

/** Constant-time compare of a password against a stored hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

/**
 * Registers JWT auth on the Fastify instance. `@fastify/jwt` decorates the
 * request with `jwtVerify()` and the instance with `jwt.sign()`.
 */
export const authPlugin = fp(async (app: FastifyInstance) => {
    await app.register(fastifyJwt, { secret: config.jwtSecret })
    app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            await req.jwtVerify<{ sub: string; email: string; role: 'owner' | 'admin' }>()
        } catch {
            reply.code(401).send({ error: 'unauthorized' })
        }
    })
    app.decorate('requireOwner', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = await req.jwtVerify<{ sub: string; email: string; role: 'owner' | 'admin' }>()
            if (user.role !== 'owner') {
                reply.code(403).send({ error: 'forbidden' })
            }
        } catch {
            reply.code(401).send({ error: 'unauthorized' })
        }
    })
})
