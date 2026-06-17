import { checksum } from '@xmcl/core'
import { IS_DEV } from '~/constant'
import { SystemModsService as ISystemModsService, SystemModsServiceKey } from '@xmcl/runtime-api'
import { Inject, LauncherAppKey, LauncherApp } from '~/app'
import { InstanceService } from '~/instance'
import { AbstractService, ExposeServiceKey } from '~/service'
import { ensureDir, copyFile, readdir, stat, writeJson } from 'fs-extra'
import { basename, join } from 'path'

/**
 * Manages system mods that are bundled with the launcher.
 * These mods are packaged inside the app resources and installed into instances
 * as protected files that users cannot delete.
 */
@ExposeServiceKey(SystemModsServiceKey)
export class SystemModsService extends AbstractService implements ISystemModsService {
  constructor(
    @Inject(LauncherAppKey) app: LauncherApp,
    @Inject(InstanceService) private instanceService: InstanceService,
  ) {
    super(app)
  }

  async getSystemModsDir(): Promise<string> {
    if (IS_DEV) {
      // In dev mode, __dirname is xmcl-electron-app/dist/
      return join(__dirname, '..', 'assets', 'system-mods')
    }
    // In production, extraResources copies to resources/system-mods
    return join((process as any).resourcesPath, 'system-mods')
  }

  async getBundledMods(): Promise<string[]> {
    const dir = await this.getSystemModsDir()
    try {
      const files = await readdir(dir)
      return files.filter(f => f.endsWith('.jar')).map(f => join(dir, f))
    } catch {
      return []
    }
  }

  async installSystemMods(instancePath: string): Promise<Array<{ path: string; sha1: string; source: 'bundled' }>> {
    const modFiles = await this.getBundledMods()
    if (modFiles.length === 0) {
      this.log(`No bundled system mods found for instance ${instancePath}`)
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

    // Remove stale system mods no longer in the bundled set
    try {
      const currentBundled = await this.getBundledMods()
      const currentNames = new Set(currentBundled.map(f => basename(f)))
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
