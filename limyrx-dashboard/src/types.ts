export interface ReleaseAsset {
    name: string
    downloads: number
    size: number
}

export interface ReleaseDownloads {
    tag: string
    name: string
    publishedAt: string
    assets: ReleaseAsset[]
    totalDownloads: number
}

export interface PublicStats {
    downloads: { total: number; perRelease: ReleaseDownloads[] }
    onlineNow: number
    installs: number
}

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

export interface TimeseriesPoint {
    at: string
    devices: number
    events: number
}

export type TimeseriesRange = '24h' | '7d' | '30d'

export interface PlayerRecord {
    _id: string
    username: string
    deviceIds: string[]
    firstSeen: string
    lastSeen: string
}

export interface PlayersResponse {
    total: number
    offset: number
    limit: number
    players: PlayerRecord[]
}

export interface Broadcast {
    _id: string
    message: string
    targetVersion: string | null
    active: boolean
    createdAt: string
}

export interface LoginResult {
    token: string
    admin: { email: string; role: string }
}
