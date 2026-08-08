import { createHash } from 'crypto'
import { ensureDir, writeFile } from 'fs-extra'
import { dirname, join } from 'path'
import { AnyError } from '@xmcl/utils'
import {
  LimyrxClientService as ILimyrxClientService,
  LimyrxClientServiceKey,
  LimyrxInstallResult,
  LimyrxManifest,
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

  async installContent(instancePath: string, minecraft: string): Promise<LimyrxInstallResult> {
    const manifest = await this.getManifest()
    const version = manifest.versions[minecraft]
    if (!version) {
      throw new AnyError(
        'LimyrxVersionNotFoundError',
        `No Limyrx Client content for Minecraft ${minecraft}`,
      )
    }
    let installed = 0
    for (const file of version.files) {
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
      const dest = join(instancePath, file.path)
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
      installed += 1
    }
    return { installed, minecraft }
  }
}
