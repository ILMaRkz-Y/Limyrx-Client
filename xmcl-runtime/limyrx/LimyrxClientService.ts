import { createHash } from 'crypto'
import { ensureDir, existsSync, pathExists, readFile, writeFile } from 'fs-extra'
import { dirname, join } from 'path'
import { AnyError } from '@xmcl/utils'
import {
  LimyrxClientService as ILimyrxClientService,
  LimyrxClientServiceKey,
  LimyrxContentUpdate,
  LimyrxFileUpdate,
  LimyrxInstallResult,
  LimyrxManifest,
  LimyrxManifestFile,
  LimyrxManifestVersion,
  LimyrxUpdateResult,
} from '@xmcl/runtime-api'
import { Inject, LauncherApp, LauncherAppKey } from '~/app'
import { AbstractService, ExposeServiceKey } from '~/service'

/**
 * Primary and fallback locations of the Limyrx Client manifest and content.
 *
 * The manifest describes every client version and the files each one needs.
 * It is hosted on the Limyrx-Client GitHub repo and served through the
 * jsDelivr CDN (raw.githubusercontent is the fallback).
 *
 * Content files (the mod jars) are fetched from raw.githubusercontent first:
 * jsDelivr caps packages at 50 MB and currently refuses this repo (its
 * tracked payload exceeds the cap), so the CDN is only a mirror.
 */
const CDN_MANIFEST_URL = 'https://cdn.jsdelivr.net/gh/ILMaRkz-Y/Limyrx-Client@main/limyrx-client/manifest.json'
const RAW_MANIFEST_URL = 'https://raw.githubusercontent.com/ILMaRkz-Y/Limyrx-Client/main/limyrx-client/manifest.json'
const RAW_CONTENT_BASE = 'https://raw.githubusercontent.com/ILMaRkz-Y/Limyrx-Client/main/limyrx-client'
const CDN_CONTENT_BASE = 'https://cdn.jsdelivr.net/gh/ILMaRkz-Y/Limyrx-Client@main/limyrx-client'

/**
 * Resolve the local content bundle: the repo's `limyrx-client/` folder that
 * electron-builder ships inside the packaged app via `extraResources`.
 *
 * The runtime never imports electron, so the packaged location is derived
 * from `process.resourcesPath` (the directory holding app.asar at runtime);
 * dev / test builds fall back to the repository checkout. Returns undefined
 * when no bundle is present so the network sources stay authoritative.
 */
function getBundledContentRoot(): string | undefined {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  const candidates = [
    resourcesPath ? join(resourcesPath, 'limyrx-client') : undefined,
    // Dev / tests: the bundle lives at <repo>/limyrx-client. The bundled
    // main runs from limyrx-electron-app/dist/main, so three levels up.
    join(__dirname, '..', '..', '..', 'limyrx-client'),
    join(process.cwd(), '..', 'limyrx-client'),
  ].filter((p): p is string => !!p)
  for (const candidate of candidates) {
    try {
      if (existsSync(join(candidate, 'manifest.json'))) return candidate
    } catch {
      // Not accessible — try the next candidate.
    }
  }
  return undefined
}

/**
 * The Limyrx Client platform: a curated Forge-based client whose mods and
 * settings are downloaded from a hosted manifest instead of the user picking
 * them individually.
 *
 * The instance itself is a plain Forge instance (the client runs on Forge), so
 * this service only supplies the "content" step: fetching the manifest,
 * downloading each file into the instance game directory and verifying the
 * SHA-1 checksums.
 */
@ExposeServiceKey(LimyrxClientServiceKey)
export class LimyrxClientService extends AbstractService implements ILimyrxClientService {
  private manifest: LimyrxManifest | undefined
  private manifestPromise: Promise<LimyrxManifest> | undefined

  constructor(@Inject(LauncherAppKey) app: LauncherApp) {
    super(app)
  }

  async getManifest(): Promise<LimyrxManifest> {
    if (this.manifest) return this.manifest
    if (!this.manifestPromise) {
      this.manifestPromise = this.fetchManifest().then((manifest) => {
        this.manifest = manifest
        return manifest
      }).catch((e) => {
        this.manifestPromise = undefined
        throw e
      })
    }
    return this.manifestPromise
  }

  async refreshManifest(): Promise<LimyrxManifest> {
    // Drop the cache so a manifest pushed since the launcher started (or a
    // failed attempt) is re-fetched. getManifest() re-populates the cache.
    this.manifest = undefined
    this.manifestPromise = undefined
    return this.getManifest()
  }

  private async fetchManifest(): Promise<LimyrxManifest> {
    for (const url of [CDN_MANIFEST_URL, RAW_MANIFEST_URL]) {
      try {
        const resp = await this.app.fetch(url, { headers: { accept: 'application/json' } })
        if (!resp.ok) continue
        const manifest = (await resp.json()) as LimyrxManifest
        if (typeof manifest !== 'object' || manifest === null || !manifest.versions) {
          throw new AnyError('LimyrxManifestInvalidError', `Invalid Limyrx Client manifest from ${url}`)
        }
        return manifest
      } catch (e) {
        this.logger.warn(`[Limyrx] Failed to fetch manifest from ${url}`)
        this.logger.warn(e)
      }
    }
    throw new AnyError('LimyrxManifestFetchError', 'Cannot fetch the Limyrx Client manifest from any source')
  }

  /**
   * Resolve the manifest entry for a Minecraft version, or throw the
   * standard not-found error.
   */
  private async getVersion(minecraft: string): Promise<LimyrxManifestVersion> {
    const manifest = await this.getManifest()
    const version = manifest.versions[minecraft]
    if (!version) {
      throw new AnyError(
        'LimyrxVersionNotFoundError',
        `No Limyrx Client content for Minecraft ${minecraft}`,
      )
    }
    return version
  }

  async installContent(instancePath: string, minecraft: string): Promise<LimyrxInstallResult> {
    // Always fetch a fresh manifest for installs: getManifest() caches for the
    // launcher session, so a launcher running since before the host pushed new
    // content would otherwise install a stale (e.g. 2-mod) bundle into brand
    // new instances.
    await this.refreshManifest()
    const version = await this.getVersion(minecraft)
    let installed = 0
    for (const file of version.files) {
      await this.downloadAndVerify(instancePath, file, version)
      installed += 1
    }
    return { installed, minecraft }
  }

  async checkContentUpdate(instancePath: string, minecraft: string): Promise<LimyrxContentUpdate> {
    // Always hit the network: an update check exists to notice content that
    // the host pushed after this launcher process started.
    const manifest = await this.refreshManifest()
    const version = manifest.versions[minecraft]
    if (!version) {
      throw new AnyError(
        'LimyrxVersionNotFoundError',
        `No Limyrx Client content for Minecraft ${minecraft}`,
      )
    }
    const files: LimyrxFileUpdate[] = []
    for (const file of version.files) {
      const dest = join(instancePath, file.path)
      const update: LimyrxFileUpdate = {
        path: file.path,
        expected: file.sha1,
        status: 'missing',
      }
      try {
        if (await pathExists(dest)) {
          const actual = await this.sha1Of(dest)
          update.actual = actual
          update.status = actual === file.sha1 ? 'up-to-date' : 'changed'
        }
      } catch (e) {
        // Unreadable file (permissions, locked…) — treat as changed so an
        // update retries it rather than skipping it silently.
        this.logger.warn(`[Limyrx] Cannot hash ${dest} for update check`)
        this.logger.warn(e)
        update.status = 'changed'
      }
      files.push(update)
    }
    const changed = files.filter((f) => f.status === 'changed').length
    const missing = files.filter((f) => f.status === 'missing').length
    const upToDate = files.filter((f) => f.status === 'up-to-date').length
    return {
      minecraft,
      files,
      changed,
      missing,
      upToDate,
      hasUpdate: changed + missing > 0,
    }
  }

  async updateContent(instancePath: string, minecraft: string): Promise<LimyrxUpdateResult> {
    const update = await this.checkContentUpdate(instancePath, minecraft)
    const version = await this.getVersion(minecraft)
    let installed = 0
    let skipped = 0
    for (const file of version.files) {
      const status = update.files.find((f) => f.path === file.path)?.status
      if (status === 'up-to-date') {
        skipped += 1
        continue
      }
      await this.downloadAndVerify(instancePath, file, version)
      installed += 1
    }
    return { installed, skipped, minecraft }
  }

  /**
   * Compute the SHA-1 hex digest of a file on disk.
   */
  private async sha1Of(path: string): Promise<string> {
    const buf = await readFile(path)
    return createHash('sha1').update(buf).digest('hex')
  }

  /**
   * Download a single manifest file into the instance, trying each source in
   * order and verifying the SHA-1 checksum before writing it to disk.
   */
  /**
   * Copy a single manifest file from the content bundle shipped with the
   * launcher into the instance, verifying the SHA-1 against the manifest.
   * Returns false when the file isn't bundled or fails verification so the
   * caller can fall back to the network.
   */
  private async installFromBundle(
    version: LimyrxManifestVersion,
    file: LimyrxManifestFile,
    dest: string,
  ): Promise<boolean> {
    const root = getBundledContentRoot()
    if (!root) return false
    const source = join(root, version.minecraft, file.path)
    try {
      if (!(await pathExists(source))) return false
      const buf = await readFile(source)
      if (createHash('sha1').update(buf).digest('hex') !== file.sha1) {
        this.logger.warn(`[Limyrx] Bundled ${file.path} failed SHA-1, falling back to network`)
        return false
      }
      await ensureDir(dirname(dest))
      await writeFile(dest, buf)
      return true
    } catch (e) {
      this.logger.warn(`[Limyrx] Cannot install bundled ${file.path}`)
      this.logger.warn(e)
      return false
    }
  }

  /**
   * Install a single manifest file into the instance, preferring the content
   * bundle shipped with the launcher (offline instance creation) and falling
   * back to the network. The manifest stays the single source of truth for
   * paths and checksums, so a stale bundle never installs unverified content.
   */
  private async downloadAndVerify(
    instancePath: string,
    file: LimyrxManifestFile,
    version: LimyrxManifestVersion,
  ): Promise<void> {
    const dest = join(instancePath, file.path)
    if (await this.installFromBundle(version, file, dest)) {
      return
    }

    // Download order: an explicit per-file URL (GitHub release asset) is
    // tried first, then raw GitHub, the CDN mirror and finally whatever the
    // manifest declares as its base. Ordering is enforced here (not trusted
    // to the manifest) so a stale cached manifest can never point downloads
    // at a dead source.
    const urls = Array.from(new Set([
      ...(file.url ? [file.url] : []),
      `${RAW_CONTENT_BASE}/${version.minecraft}/${file.path}`,
      `${CDN_CONTENT_BASE}/${version.minecraft}/${file.path}`,
      `${version.base}/${file.path}`,
    ]))
    let resp: Response | undefined
    let lastError: unknown
    for (const url of urls) {
      try {
        const r = await this.app.fetch(url)
        if (r.ok) {
          resp = r
          break
        }
        lastError = new AnyError('LimyrxFileDownloadError', `Failed to download ${url}: HTTP ${r.status}`)
      } catch (e) {
        lastError = e
      }
    }
    if (!resp) {
      throw new AnyError('LimyrxFileDownloadError', `Failed to download ${file.path} from any source`, { cause: lastError })
    }
    const buf = Buffer.from(await resp.arrayBuffer())
    const sha1 = createHash('sha1').update(buf).digest('hex')
    if (sha1 !== file.sha1) {
      throw new AnyError(
        'LimyrxFileHashMismatchError',
        `Checksum mismatch for ${file.path}: expected ${file.sha1}, got ${sha1}`,
      )
    }
    await ensureDir(dirname(dest))
    await writeFile(dest, buf)
  }
}
