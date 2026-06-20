import { checksum } from '@xmcl/core'
import { SystemModsService as ISystemModsService, SystemModsServiceKey } from '@xmcl/runtime-api'
import { Inject, LauncherAppKey, LauncherApp } from '~/app'
import { InstanceService } from '~/instance'
import { AbstractService, ExposeServiceKey } from '~/service'
import { ensureDir, readdir, stat, writeJson } from 'fs-extra'
import { createWriteStream } from 'fs'
import { basename, join } from 'path'
import { pipeline } from 'stream/promises'
import { createGunzip } from 'zlib'
import { Readable } from 'stream'

/**
 * The GitHub repo that hosts the system mods.
 * Mod JARs are uploaded as release assets and downloaded on-demand.
 */
const MODS_REPO_OWNER = 'Yassir2010-gif'
const MODS_REPO_NAME = 'Limyrx-Launcher'
const MODS_VERSION = 'v0.56.8'

/**
 * List of system mods to download from GitHub releases.
 * Files are expected at:
 *   https://github.com/{owner}/{repo}/releases/download/{version}/{fileName}
 */
const SYSTEM_MODS = [
  'BetterFps-1.2.0.jar',
  'CustomSkinLoader_ForgeV1-14.28.jar',
  'FpsReducer-mc1.8.9-1.10.3.jar',
  'Ksyxis-1.4.3.jar',
  'OptiFine_1.8.9_HD_U_M5.jar',
  'limyrx-1.0.0.jar',
  'waveycapes-forge-mc1.8.9-1.2.0.jar',
]

/**
 * Manages system mods that are downloaded from GitHub releases.
 * These mods are installed into instances as protected files that users cannot delete.
 */
@ExposeServiceKey(SystemModsServiceKey)
export class SystemModsService extends AbstractService implements ISystemModsService {
  constructor(
    @Inject(LauncherAppKey) app: LauncherApp,
    @Inject(InstanceService) private instanceService: InstanceService,
  ) {
    super(app)
  }

  private getBaseUrl(): string {
    return `https://github.com/${MODS_REPO_OWNER}/${MODS_REPO_NAME}/releases/download/${MODS_VERSION}`
  }

  private getCachedModsDir(): string {
    return join(this.app.appDataPath, 'system-mods')
  }

  /**
   * Download all system mods from GitHub to the local cache.
   */
  async downloadMods(): Promise<string[]> {
    const cacheDir = this.getCachedModsDir()
    await ensureDir(cacheDir)

    const downloaded: string[] = []
    const baseUrl = this.getBaseUrl()

    for (const fileName of SYSTEM_MODS) {
      const dest = join(cacheDir, fileName)

      // Check if already cached
      try {
        const cachedStat = await stat(dest)
        if (cachedStat.isFile() && cachedStat.size > 0) {
          downloaded.push(dest)
          continue
        }
      } catch {
        // doesn't exist, download it
      }

      const url = `${baseUrl}/${fileName}`
      const gzUrl = `${url}.gz`

      try {
        this.log(`Downloading system mod: ${fileName}`)
        const tempFile = dest + '.tmp'

        // Try compressed version first
        const gzResponse = await this.app.fetch(gzUrl, { method: 'HEAD' }).catch(() => null)
        const downloadUrl = gzResponse?.ok ? gzUrl : url

        const response = await this.app.fetch(downloadUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const body = response.body
        if (!body) throw new Error('No response body')

        if (downloadUrl === gzUrl) {
          // Decompress gzip on-the-fly
          const nodeStream = Readable.fromWeb(body as any)
          await pipeline(nodeStream, createGunzip(), createWriteStream(tempFile))
        } else {
          const nodeStream = Readable.fromWeb(body as any)
          await pipeline(nodeStream, createWriteStream(tempFile))
        }

        const { rename } = await import('fs/promises')
        await rename(tempFile, dest)

        this.log(`Downloaded system mod: ${fileName}`)
        downloaded.push(dest)
      } catch (e) {
        this.error(new Error(`Failed to download system mod ${fileName}: ${e}`))
      }
    }

    return downloaded
  }

  async getBundledMods(): Promise<string[]> {
    // First try the cache directory
    const cacheDir = this.getCachedModsDir()
    try {
      const files = await readdir(cacheDir)
      const cached = files.filter(f => f.endsWith('.jar')).map(f => join(cacheDir, f))
      if (cached.length > 0) {
        return cached
      }
    } catch {
      // cache doesn't exist yet
    }

    // If no cached mods, download them
    return await this.downloadMods()
  }

  async installSystemMods(instancePath: string): Promise<Array<{ path: string; sha1: string; source: 'bundled' }>> {
    const modFiles = await this.getBundledMods()
    if (modFiles.length === 0) {
      this.log(`No system mods available for instance ${instancePath}`)
      return []
    }

    const modsDir = join(instancePath, 'mods')
    await ensureDir(modsDir)

    const installed: Array<{ path: string; sha1: string; source: 'bundled' }> = []

    for (const src of modFiles) {
      const fileName = basename(src)
      const dest = join(modsDir, fileName)

      try {
        const srcSha1 = await checksum(src, 'sha1')

        let needsCopy = true
        try {
          const destStat = await stat(dest)
          if (destStat.isFile()) {
            const destSha1 = await checksum(dest, 'sha1')
            if (destSha1 === srcSha1) {
              needsCopy = false
            }
          }
        } catch {
          // dest doesn't exist
        }

        if (needsCopy) {
          const { copyFile } = await import('fs/promises')
          await copyFile(src, dest)
          this.log(`Installed system mod: ${fileName} -> ${dest}`)
        }

        const relPath = `mods/${fileName}`
        installed.push({ path: relPath, sha1: srcSha1, source: 'bundled' })
      } catch (e) {
        this.error(new Error(`Failed to install system mod ${fileName}: ${e}`))
      }
    }

    if (installed.length > 0) {
      const instance = this.instanceService.state.all[instancePath]
      if (instance) {
        const existingSystemFiles = instance.systemFiles || []
        const existingPaths = new Set(existingSystemFiles.map(s => s.path))

        const toAdd = installed.filter(s => !existingPaths.has(s.path))
        if (toAdd.length > 0) {
          instance.systemFiles = [...existingSystemFiles, ...toAdd]
          this.instanceService.state.instanceEdit({ systemFiles: instance.systemFiles, path: instancePath })
        }
      }

      const inst = this.instanceService.state.all[instancePath]
      if (inst) {
        await writeJson(join(instancePath, 'instance.json'), inst)
      }
    }

    return installed
  }

  async ensureSystemMods(instancePath: string): Promise<void> {
    const installed = await this.installSystemMods(instancePath)

    // Remove stale system mods no longer in the system mod list
    try {
      const currentNames = new Set(SYSTEM_MODS)
      const instance = this.instanceService.state.all[instancePath]
      if (instance?.systemFiles) {
        const remaining = []
        const modsDir = join(instancePath, 'mods')
        let changed = false
        for (const sf of instance.systemFiles) {
          const fileName = basename(sf.path)
          if (!currentNames.has(fileName)) {
            const fp = join(modsDir, fileName)
            try {
              const { unlink } = await import('fs/promises')
              await unlink(fp)
              this.log(`Removed stale system mod: ${fileName}`)
            } catch (e) {
              if (e.code !== 'ENOENT') this.warn(`Failed to remove stale system mod ${fileName}: ${e}`)
            }
            changed = true
          } else {
            remaining.push(sf)
          }
        }
        if (changed) {
          instance.systemFiles = remaining
          this.instanceService.state.instanceEdit({ systemFiles: remaining, path: instancePath })
        }
      }
    } catch (e) {
      this.error(new Error('Failed to clean stale system mods: ' + e))
    }

    if (installed.length > 0) {
      this.log(`Ensured ${installed.length} system mods for instance ${instancePath}`)
    }
  }
}
