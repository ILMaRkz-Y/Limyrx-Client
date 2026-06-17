import { LauncherAppPlugin } from '~/app'
import { InstanceService } from '~/instance'
import { SystemModsService } from '~/instanceIO'
import { InstallService } from '~/install'
import { checksum } from '@xmcl/core'
import { join } from 'path'
import { ensureDir, writeFile, writeJson } from 'fs-extra'

/**
 * ≪ CHANGE THIS to match your modpack ≫
 */
const CONFIG = {
  /** The name of the default instance shown in the launcher */
  instanceName: 'My Modded Client',
  /** Minecraft version */
  minecraft: '1.8.9',
  /** Forge version for this Minecraft version. Check https://files.minecraftforge.net/net/minecraftforge/forge/ */
  forge: '11.15.1.2318',
  minMemory: 2048,
  maxMemory: 4096,
  /**
   * GitHub release URL for mod auto-updates.
   * The launcher will download any .jar assets from the latest release.
   * 
   * Examples:
   *   'https://api.github.com/repos/FabricMC/fabric/releases/latest'
   *   'https://api.github.com/repos/your-user/your-repo/releases/latest'
   * 
   * Leave empty to disable.
   */
  githubReleaseUrl: '',
}

/**
 * Download .jar assets from the latest GitHub release into the instance mods folder.
 * New mods are registered as protected system files.
 */
async function syncModsFromGitHub(
  instancePath: string,
  githubUrl: string,
  instanceService: InstanceService,
  fetch: typeof globalThis.fetch,
  logger: { log: (m: string) => void; warn: (m: string) => void; error: (e: Error) => void },
): Promise<void> {
  logger.log(`Checking GitHub release: ${githubUrl}`)

  let release: any
  try {
    const res = await fetch(githubUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'xmcl-launcher' },
    })
    if (!res.ok) {
      logger.warn(`GitHub API returned ${res.status}`)
      return
    }
    release = await res.json()
  } catch (e) {
    logger.warn(`Failed to fetch GitHub release: ${e}`)
    return
  }

  const assets = (release.assets || []) as Array<{ name: string; browser_download_url: string }>
  const jarAssets = assets.filter(a => a.name.endsWith('.jar'))

  if (jarAssets.length === 0) {
    logger.log('No .jar assets found in latest GitHub release')
    return
  }

  const modsDir = join(instancePath, 'mods')
  await ensureDir(modsDir)
  const installed: Array<{ path: string; sha1: string; source: 'bundled' }> = []

  for (const asset of jarAssets) {
    const dest = join(modsDir, asset.name)
    logger.log(`Downloading GitHub mod: ${asset.name}`)
    try {
      const res = await fetch(asset.browser_download_url)
      if (!res.ok) {
        logger.warn(`Failed to download ${asset.name}: HTTP ${res.status}`)
        continue
      }
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(dest, buf)
      const sha1 = await checksum(dest, 'sha1')
      installed.push({ path: `mods/${asset.name}`, sha1, source: 'bundled' })
      logger.log(`Installed GitHub mod: ${asset.name}`)
    } catch (e) {
      logger.warn(`Failed to download ${asset.name}: ${e}`)
    }
  }

  if (installed.length > 0) {
    const inst = instanceService.state.all[instancePath]
    if (inst) {
      const existingPaths = new Set((inst.systemFiles || []).map(s => s.path))
      const toAdd = installed.filter(s => !existingPaths.has(s.path))
      if (toAdd.length > 0) {
        inst.systemFiles = [...(inst.systemFiles || []), ...toAdd]
        instanceService.state.instanceEdit({ systemFiles: inst.systemFiles, path: instancePath })
        await writeJson(join(instancePath, 'instance.json'), inst)
      }
    }
  }
}

export const pluginAdminManagedInstance: LauncherAppPlugin = async (app) => {
  app.once('app-booted', async () => {
    const logger = app.getLogger('AdminManagedInstance')

    try {
      const instanceService = await app.registry.get(InstanceService)
      await instanceService.initialize()

      // ── Step 1: Create default instance if none exist ──
      if (instanceService.state.instances.length === 0) {
        logger.log('No instances — creating default modded instance')
        const path = await instanceService.createInstance({
          name: CONFIG.instanceName,
          runtime: {
            minecraft: CONFIG.minecraft,
            forge: CONFIG.forge,
          },
          minMemory: CONFIG.minMemory,
          maxMemory: CONFIG.maxMemory,
          locked: true,
        })
        logger.log(`Created instance at ${path}`)

        // ── Step 2: Install Minecraft + Forge so the instance is ready to play ──
        try {
          const installService = await app.registry.getOrCreate(InstallService)

          // Fetch Minecraft version metadata from Mojang
          logger.log(`Installing Minecraft ${CONFIG.minecraft}...`)
          const manifestRes = await app.fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')
          if (manifestRes.ok) {
            const manifest = await manifestRes.json() as { versions: Array<{ id: string; url: string }> }
            const versionEntry = manifest.versions.find((v: any) => v.id === CONFIG.minecraft)
            if (versionEntry) {
              const metaRes = await app.fetch(versionEntry.url)
              if (metaRes.ok) {
                const meta = await metaRes.json()
                await installService.installMinecraft({ meta, side: 'client' })
                logger.log('Minecraft installed')

                // Install Forge (requires Java to be available)
                logger.log(`Installing Forge ${CONFIG.forge} for ${CONFIG.minecraft}...`)
                try {
                  const forgeVersion = await installService.installForge({
                    mcversion: CONFIG.minecraft,
                    version: CONFIG.forge,
                  })
                  logger.log(`Forge installed: ${forgeVersion}`)
                } catch (forgeErr) {
                  logger.warn(`Forge install failed (may need Java): ${forgeErr}`)
                  logger.log('User can install Forge from the launcher UI by clicking the Install button')
                }
              } else {
                logger.warn(`Failed to fetch metadata for ${CONFIG.minecraft}`)
              }
            } else {
              logger.warn(`Minecraft version ${CONFIG.minecraft} not found in manifest`)
            }
          } else {
            logger.warn('Failed to fetch version manifest')
          }
        } catch (installErr) {
          logger.warn(`Install error (instance will still work via Install button): ${installErr}`)
        }
      }

      // ── Step 3: Install system mods + GitHub mods on all instances ──
      const systemModsService = await app.registry.getOrCreate(SystemModsService)

      for (const instance of instanceService.state.instances) {
        logger.log(`Setting up instance: ${instance.name} (${instance.path})`)

        await systemModsService.ensureSystemMods(instance.path)

        if (CONFIG.githubReleaseUrl) {
          await syncModsFromGitHub(
            instance.path,
            CONFIG.githubReleaseUrl,
            instanceService,
            app.fetch.bind(app),
            logger,
          )
        }
      }

      logger.log('Instance setup complete')
    } catch (e) {
      logger.warn(`Setup error: ${e}`)
    }
  })
}
