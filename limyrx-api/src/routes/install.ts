import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { Device } from '../db/models'

interface InstallBody {
    deviceId: string
    launcherVersion?: string
    os?: string
    /** The operating-system account name, sent on the user's first run. */
    username?: string
}

/** In-flight webhook sends keyed by deviceId, so a burst never double-fires. */
const inflight = new Map<string, Promise<boolean>>()

/**
 * Fire the "new install" Discord webhook for a device.
 *
 * The webhook URL lives in the server env (`DISCORD_WEBHOOK_URL`), never in
 * the shipped launcher. The message includes the OS account name the user
 * chose to share on first run.
 */
async function notifyDiscord(
    log: FastifyInstance['log'],
    details: {
        deviceId: string
        username?: string
        launcherVersion?: string
        os?: string
    },
): Promise<boolean> {
    const webhookUrl = config.discordWebhookUrl
    if (!webhookUrl) {
        return false
    }
    const existing = inflight.get(details.deviceId)
    if (existing) {
        return existing
    }
    const payload = {
        username: 'Limyrx Install',
        embeds: [
            {
                color: 0x7c6cff,
                title: 'New Limyrx launcher install',
                timestamp: new Date().toISOString(),
                fields: [
                    { name: 'User', value: details.username || 'unknown', inline: true },
                    { name: 'OS', value: details.os || 'unknown', inline: true },
                    { name: 'Version', value: details.launcherVersion || 'unknown', inline: true },
                    { name: 'Device', value: details.deviceId.slice(0, 8), inline: true },
                ],
            },
        ],
    }
    const send = (async () => {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                log.warn(`[install] Discord webhook returned HTTP ${res.status}`)
            }
            return res.ok
        } catch (err) {
            log.warn(`[install] Discord webhook failed: ${String(err)}`)
            return false
        } finally {
            inflight.delete(details.deviceId)
        }
    })()
    inflight.set(details.deviceId, send)
    return send
}

/**
 * `POST /api/v1/first-install`
 *
 * One-time, always-on ping from the launcher the very first time it runs on a
 * machine (independent of the opt-in metrics toggle). Lets the dashboard count
 * real installs and fires the Discord new-install notification.
 */
export async function installRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Body: InstallBody }>('/first-install', async (req, reply) => {
        const { deviceId, launcherVersion, os, username } = req.body ?? {}
        if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) {
            return reply.code(400).send({ error: 'deviceId is required' })
        }

        const now = new Date()
        const existing = await Device.findOne({ deviceId })

        if (existing) {
            await Device.updateOne(
                { deviceId },
                { $set: { lastSeen: now, ...(launcherVersion ? { launcherVersion } : {}) } })
            if (!existing.installNotified) {
                const fired = await notifyDiscord(app.log, { deviceId, username, launcherVersion, os })
                if (fired) {
                    await Device.updateOne({ deviceId }, { $set: { installNotified: true } })
                }
            }
            return { ok: true }
        }

        await Device.create({
            deviceId,
            firstSeen: now,
            lastSeen: now,
            launcherVersion,
            os,
        })

        const fired = await notifyDiscord(app.log, { deviceId, username, launcherVersion, os })
        if (fired) {
            await Device.updateOne({ deviceId }, { $set: { installNotified: true } })
        }

        return { ok: true, installs: await Device.countDocuments() }
    })
}