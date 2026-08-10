import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { Admin } from '../db/models'
import { hashPassword, verifyPassword } from '../auth/auth'

interface LoginBody {
    email: string
    password: string
}

interface BootstrapBody {
    email: string
    password: string
    token: string
}

/**
 * Admin auth:
 *  - `POST /auth/login` — email + password → JWT (signed with JWT_SECRET).
 *  - `POST /auth/bootstrap` — create the FIRST admin while the admins
 *    collection is empty, guarded by ADMIN_BOOTSTRAP_TOKEN from the env.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: LoginBody }>('/auth/login', async (req, reply) => {
        const { email, password } = req.body ?? {}
        if (!email || !password) {
            return reply.code(400).send({ error: 'email and password are required' })
        }
        const admin = await Admin.findOne({ email: email.trim().toLowerCase() })
        if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
            return reply.code(401).send({ error: 'invalid credentials' })
        }
        const token = app.jwt.sign(
            { sub: admin.id, email: admin.email, role: admin.role },
            { expiresIn: '12h' },
        )
        return { token, admin: { email: admin.email, role: admin.role } }
    })

    app.post<{ Body: BootstrapBody }>('/auth/bootstrap', async (req, reply) => {
        const { email, password, token } = req.body ?? {}
        if (!config.adminBootstrapToken || token !== config.adminBootstrapToken) {
            return reply.code(403).send({ error: 'forbidden' })
        }
        if (!email || !password) {
            return reply.code(400).send({ error: 'email and password are required' })
        }
        const existing = await Admin.findOne({ email: email.trim().toLowerCase() })
        if (existing) {
            return reply.code(409).send({ error: 'admin already exists' })
        }
        const admin = await Admin.create({
            email: email.trim().toLowerCase(),
            passwordHash: await hashPassword(password),
            role: 'owner',
        })
        const tokenSigned = app.jwt.sign(
            { sub: admin.id, email: admin.email, role: admin.role },
            { expiresIn: '12h' },
        )
        return { token: tokenSigned, admin: { email: admin.email, role: admin.role } }
    })
}
