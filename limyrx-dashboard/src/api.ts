import type {
    Broadcast,
    LoginResult,
    OverviewStats,
    PlayersResponse,
    PublicStats,
    ReleaseDownloads,
    TimeseriesPoint,
    TimeseriesRange,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.limyrx.online/api/v1'

const TOKEN_KEY = 'limyrx_dashboard_token'
const ADMIN_KEY = 'limyrx_dashboard_admin'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function getAdminEmail(): string | null {
    return localStorage.getItem(ADMIN_KEY)
}

export function setSession(token: string, email: string): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(ADMIN_KEY, email)
}

export function clearSession(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken()
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.headers ?? {}),
        },
    })
    if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`
        try {
            const body = (await res.json()) as { error?: string }
            if (body.error) {
                detail = body.error
            }
        } catch {
            // keep the status-based message when the body is not JSON
        }
        throw new Error(detail)
    }
    if (res.status === 204) {
        return undefined as T
    }
    return (await res.json()) as T
}

export function getPublicStats(): Promise<PublicStats> {
    return request<PublicStats>('/stats/public')
}

export function getPublicReleases(): Promise<ReleaseDownloads[]> {
    return request<ReleaseDownloads[]>('/releases')
}

export function login(email: string, password: string): Promise<LoginResult> {
    return request<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
}

export function getOverview(): Promise<OverviewStats> {
    return request<OverviewStats>('/admin/stats/overview')
}

export function getTimeseries(range: TimeseriesRange): Promise<TimeseriesPoint[]> {
    return request<TimeseriesPoint[]>(`/admin/stats/timeseries?range=${range}`)
}

export function getAdminReleases(): Promise<ReleaseDownloads[]> {
    return request<ReleaseDownloads[]>('/admin/releases')
}

export function getPlayers(
    q: string,
    sort: 'lastSeen' | 'firstSeen',
    limit: number,
    offset: number,
): Promise<PlayersResponse> {
    const params = new URLSearchParams({
        q,
        sort,
        limit: String(limit),
        offset: String(offset),
    })
    return request<PlayersResponse>(`/admin/players?${params.toString()}`)
}

export function getBroadcasts(): Promise<Broadcast[]> {
    return request<Broadcast[]>('/admin/broadcasts')
}

export function createBroadcast(message: string, targetVersion: string | null, active: boolean): Promise<Broadcast> {
    return request<Broadcast>('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ message, targetVersion, active }),
    })
}
