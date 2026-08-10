import { config } from './config'

export interface ReleaseDownloads {
    tag: string
    name: string
    publishedAt: string
    assets: Array<{ name: string; downloads: number; size: number }>
    totalDownloads: number
}

interface GithubAsset {
    name: string
    download_count: number
    size: number
}

interface GithubRelease {
    tag_name: string
    name: string
    published_at: string
    assets: GithubAsset[]
}

let cache: { at: number; value: ReleaseDownloads[] } | undefined

/**
 * Fetch release + per-asset download counts from the GitHub API. Cached
 * in-memory (GITHUB_CACHE_MS, default 5 min) because the counts only change
 * when a new asset is downloaded.
 */
export async function getReleaseDownloads(force = false): Promise<ReleaseDownloads[]> {
    if (!force && cache && Date.now() - cache.at < config.githubCacheMs) {
        return cache.value
    }
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'limyrx-api',
    }
    if (config.githubToken) {
        headers.Authorization = `Bearer ${config.githubToken}`
    }
    const res = await fetch(`https://api.github.com/repos/${config.githubRepo}/releases?per_page=10`, { headers })
    if (!res.ok) {
        throw new Error(`GitHub releases request failed: ${res.status} ${await res.text()}`)
    }
    const releases = (await res.json()) as GithubRelease[]
    const value: ReleaseDownloads[] = releases.map((r) => ({
        tag: r.tag_name,
        name: r.name,
        publishedAt: r.published_at,
        assets: r.assets.map((a) => ({ name: a.name, downloads: a.download_count, size: a.size })),
        totalDownloads: r.assets.reduce((sum, a) => sum + a.download_count, 0),
    }))
    cache = { at: Date.now(), value }
    return value
}

/** Total downloads across all fetched releases (i.e. installer downloads). */
export async function getTotalDownloads(): Promise<number> {
    const releases = await getReleaseDownloads()
    return releases.reduce((sum, r) => sum + r.totalDownloads, 0)
}
