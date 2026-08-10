import { Device, Event } from './db/models'
import { config } from './config'
import { getTotalDownloads } from './github'

export interface OverviewStats {
    totalDownloads: number
    installs: number
    onlineNow: number
    dau: number
    wau: number
    mau: number
    byVersion: Array<{ launcherVersion: string; count: number }>
    byOs: Array<{ os: string; count: number }>
}

function nowMinus(ms: number): Date {
    return new Date(Date.now() - ms)
}

export const DAY_MS = 24 * 60 * 60 * 1000

/** Distinct devices with a heartbeat inside the online window. */
export async function countOnlineNow(): Promise<number> {
    return Device.countDocuments({ lastSeen: { $gte: nowMinus(config.onlineWindowMs) } })
}

/**
 * Dashboard cards + breakdowns. Installs = total known devices. DAU/WAU/MAU =
 * distinct devices active within the last 1/7/30 days.
 */
export async function getOverview(): Promise<OverviewStats> {
    const [totalDownloads, installs, onlineNow, dau, wau, mau, byVersion, byOs] = await Promise.all([
        getTotalDownloads().catch(() => 0),
        Device.countDocuments(),
        countOnlineNow(),
        Device.countDocuments({ lastSeen: { $gte: nowMinus(DAY_MS) } }),
        Device.countDocuments({ lastSeen: { $gte: nowMinus(7 * DAY_MS) } }),
        Device.countDocuments({ lastSeen: { $gte: nowMinus(30 * DAY_MS) } }),
        Device.aggregate<{ launcherVersion: string; count: number }>([
            { $group: { _id: '$launcherVersion', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 12 },
            { $project: { launcherVersion: '$_id', count: 1, _id: 0 } },
        ]),
        Device.aggregate<{ os: string; count: number }>([
            { $group: { _id: '$os', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 12 },
            { $project: { os: '$_id', count: 1, _id: 0 } },
        ]),
    ])
    return { totalDownloads, installs, onlineNow, dau, wau, mau, byVersion, byOs }
}

export interface TimeseriesPoint {
    /** Start of the bucket (ISO). */
    at: string
    /** Distinct devices active in the bucket. */
    devices: number
    /** Discrete events in the bucket. */
    events: number
}

/**
 * Active-device + event counts bucketed by hour (24h) or day (7d/30d).
 * Uses the events collection (written per heartbeat) as the source so the
 * bucketing stays a simple groupBy, not a per-device double-count pass.
 */
export async function getTimeseries(range: '24h' | '7d' | '30d' = '24h'): Promise<TimeseriesPoint[]> {
    const bucketMs = range === '24h' ? 60 * 60 * 1000 : DAY_MS
    const windowMs = range === '24h' ? DAY_MS : range === '7d' ? 7 * DAY_MS : 30 * DAY_MS
    const since = nowMinus(windowMs)
    const buckets: TimeseriesPoint[] = []
    for (let at = since.getTime(); at <= Date.now(); at += bucketMs) {
        buckets.push({ at: new Date(at).toISOString(), devices: 0, events: 0 })
    }

    const rows = await Event.aggregate<{ bucket: number; devices: number; events: number }>([
        { $match: { at: { $gte: since } } },
        {
            $group: {
                _id: {
                    $subtract: [
                        { $toLong: '$at' },
                        { $mod: [{ $subtract: [{ $toLong: '$at' }, since.getTime()] }, bucketMs] },
                    ],
                },
                devices: { $addToSet: '$deviceId' },
                events: { $sum: 1 },
            },
        },
        { $project: { bucket: '$_id', events: 1, devices: { $size: '$devices' }, _id: 0 } },
    ])

    for (const row of rows) {
        const idx = Math.floor((row.bucket - since.getTime()) / bucketMs)
        if (idx >= 0 && idx < buckets.length) {
            buckets[idx].devices = row.devices
            buckets[idx].events = row.events
        }
    }
    return buckets
}
