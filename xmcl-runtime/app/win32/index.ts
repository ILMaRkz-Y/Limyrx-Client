import { AppManifest, InstalledAppManifest } from '@xmcl/runtime-api'
import { ensureDir, unlink, writeFile } from 'fs-extra'
import { downloadIcon } from '../utils'
import { join } from 'path'
import { LauncherApp } from '../LauncherApp'

export async function removeShortcut(outputDir: string, man: InstalledAppManifest) {
  let outputPath = join(outputDir, `${man.name}.lnk`)
  await unlink(outputPath).catch(() => { })
  outputPath = join(outputDir, `${man.name}.url`)
  await unlink(outputPath).catch(() => { })
}

export async function createLinkWin32(app: LauncherApp, exePath: string, outputDir: string, man: InstalledAppManifest, globalShortcut: boolean): Promise<void> {
  const urlContent =
  `[InternetShortcut]
  URL=xmcl://launcher/app?url=${man.url}
  WorkingDirectory=.
  IconIndex=0
  IconFile=${man.iconSets.icon}`
  await writeFile(join(outputDir, `${man.name}.url`), urlContent)
}

export function createShortcutWin32(app: LauncherApp, exePath: string, outputDir: string, man: InstalledAppManifest, globalShortcut: boolean): boolean {
  const windowModes = {
    normal: 1,
    maximized: 3,
    minimized: 7,
  }

  const filePath = exePath
  let icon = man.iconSets.icon
  let args = `--url=${man.url}`
  if (globalShortcut) {
    args += ' --global'
  }
  const description = man.description
  const cwd = ''
  // const windowMode = windowModes.normal.toString()
  // const hotkey = ''
  const outputPath = join(outputDir, `${man.name}.lnk`)

  if (!icon) {
    if (
      filePath.endsWith('.dll') ||
      filePath.endsWith('.exe')
    ) {
      icon = filePath + ',0'
    } else {
      icon = filePath
    }
  }

  const options = {
    target: exePath,
    args,
    description,
    cwd,
    icon,
    iconIndex: 0,
  }

  return app.shell.createShortcut(outputPath, options)
}

export async function installWin32(url: string, appDir: string, man: AppManifest): Promise<InstalledAppManifest> {
  if (man.iconUrls?.icon) {
    try {
      const icoPath = join(appDir, 'app.ico')
      await ensureDir(appDir)
      await downloadIcon(new URL(man.iconUrls.icon, url).toString(), icoPath)
    } catch (e) {
      console.warn('Failed to download app icon', e)
    }
  }

  return {
    name: man.name ?? '',
    description: man.description ?? '',
    screenshots: man.screenshots ?? [],

    iconUrls: man.iconUrls,
    url,
    iconSets: man.iconUrls as any,
    minHeight: man.minHeight ?? 600,
    minWidth: man.minWidth ?? 800,
    defaultHeight: man.defaultHeight ?? 600,
    defaultWidth: man.defaultWidth ?? 800,
    ratio: man.ratio ?? false,
    backgroundColor: man.backgroundColor ?? '',
    vibrancy: false,
  }
}

