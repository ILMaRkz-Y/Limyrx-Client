import { ElectronController } from '@/ElectronController'
import { app, BrowserWindow, clipboard, dialog, FindInPageOptions, ipcMain, nativeImage, systemPreferences } from 'electron'
import { ControllerPlugin } from './plugin'
import { execFile } from 'child_process'
import { platform } from 'os'
import { writeFile } from 'fs-extra'
import { isNiri } from '@/utils/niri'

export enum Operation {
  Minimize = 0,
  Maximize = 1,
  Hide = 2,
  Show = 3,
  Close = 4,
}

export const windowController: ControllerPlugin = function (this: ElectronController) {
  const currentPlatform = platform()

  app.on('browser-window-created', (_, win: BrowserWindow) => {
    // Wrap webContents.send with destroyed-guards. Without these, fullscreen /
    // maximize events fired after the window starts closing throw
    // "Object has been destroyed" (telemetry: BrowserWindow.<anonymous>
    // / WebContents._.send buckets on 0.56.7).
    const safeSend = (channel: string, ...args: unknown[]) => {
      if (win.isDestroyed()) return
      const wc = win.webContents
      if (!wc || wc.isDestroyed()) return
      try {
        wc.send(channel, ...args)
      } catch {
        // window torn down mid-send — drop quietly
      }
    }
    win.on('maximize', () => {
      safeSend('maximize', win.isDestroyed() ? false : win.isMaximized())
    })
    win.on('enter-full-screen', () => {
      safeSend('maximize', win.isDestroyed() ? false : win.fullScreen)
    })
    win.on('leave-full-screen', () => {
      safeSend('maximize', win.isDestroyed() ? false : win.fullScreen)
    })
    win.on('minimize', () => {
      safeSend('minimize', win.isDestroyed() ? false : win.isMaximized())
    })
  })
  ipcMain.handle('focus', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.show()
    }
  })
  ipcMain.handle('write-clipboard', (_, text: string) => {
    clipboard.writeText(text)
  })
  ipcMain.handle('dialog:showOpenDialog', (event, ...args) => {
    return dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, args[0])
  })
  ipcMain.handle('dialog:showSaveDialog', (event, ...args) => {
    return dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender)!, args[0])
  })
  ipcMain.handle('find-in-page', (event, text: string, options: FindInPageOptions) => {
    event.sender.findInPage(text, options)
  })
  ipcMain.handle('stop-find-in-page', (event) => {
    event.sender.stopFindInPage('clearSelection')
  })
  ipcMain.handle('start-profiling', (event) => {
    event.sender.debugger.sendCommand('Profiler.enable')
    event.sender.debugger.sendCommand('Network.enable')
  })
  ipcMain.handle('stop-profiling', async (event) => {
    const data = await event.sender.debugger.sendCommand('Profiler.stop').then(r => r.profile).catch(() => null)

    if (data) {
      const fileName = `profile-${Date.now()}.cpuprofile`
      dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender)!, {
        defaultPath: fileName,
      }).then(({ filePath: path }) => {
        if (path && data) {
          writeFile(path, JSON.stringify(data)).catch((e) => {
            this.logger.error(e)
          })
        }
      })
    }
  })
  ipcMain.handle('isMaximized', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isMaximized()
  })
  ipcMain.handle('flash-frame', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.flashFrame(true)
      window.once('focus', () => {
        window.flashFrame(false)
      })
    }
  })
  ipcMain.handle('write-clipboard-image', async (event, imageUrl: string) => {
    const img = await event.sender.session.fetch(imageUrl).then(res => res.arrayBuffer())
    const url = new URL(imageUrl)
    let fileName = ''
    if (url.host === 'launcher' && url.pathname.startsWith('/media/')) {
      fileName = url.pathname.replace('/media/', '')
    }
    clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(img)))
  })
  ipcMain.handle('query-audio-permission', async () => {
    if (currentPlatform === 'darwin') {
      await app.whenReady()
      return systemPreferences.askForMediaAccess('microphone')
    }
    return true
  })
  ipcMain.handle('set-translucent', (_, enable: boolean) => {
    this.setWindowTranslucent(enable)
  })
  // In-flight agent LLM requests, keyed by renderer-supplied request id so
  // the renderer can abort a specific call (fetch signals cannot cross IPC).
  const agentRequests = new Map<string, AbortController>()
  ipcMain.handle('agent-request', async (event, payload: { endpoint: string; apiKey: string; body: Record<string, unknown>; requestId?: string }) => {
    const { endpoint, apiKey, body, requestId } = payload ?? {}
    if (!endpoint || !apiKey || !body) {
      return { ok: false, status: 0, error: 'agent-request: missing endpoint/apiKey/body' }
    }
    const ctrl = new AbortController()
    if (requestId) agentRequests.set(requestId, ctrl)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        return { ok: false, status: res.status, error: text || res.statusText }
      }
      const data = await res.json()
      return { ok: true, status: res.status, data }
    } catch (e) {
      if (ctrl.signal.aborted) {
        return { ok: false, status: 0, error: 'Aborted' }
      }
      return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) }
    } finally {
      if (requestId) agentRequests.delete(requestId)
    }
  })
  ipcMain.handle('agent-abort', (_, requestId: string) => {
    agentRequests.get(requestId)?.abort()
  })
  // Resolve the OS desktop wallpaper path for the theme "desktop background"
  // option. Cross-platform, best-effort: returns `{ error }` when the current
  // platform's wallpaper cannot be read.
  ipcMain.handle('get-desktop-wallpaper', async () => {
    const exec = (cmd: string, args: string[]) => new Promise<string>((resolve, reject) => {
      execFile(cmd, args, { encoding: 'utf8' }, (err, stdout) => (err ? reject(err) : resolve(stdout)))
    })
    try {
      if (process.platform === 'win32') {
        const stdout = await exec('reg', ['query', 'HKCU\\Control Panel\\Desktop', '/v', 'WallPaper'])
        const m = /WallPaper\s+REG_SZ\s+(.+)/i.exec(stdout)
        const path = m?.[1]?.trim()
        if (path) return { path }
        return { error: 'cannot read desktop wallpaper from registry' }
      }
      if (process.platform === 'darwin') {
        const stdout = await exec('osascript', ['-e', 'tell app "finder" to get posix path of (desktop picture as alias)'])
        const path = stdout.trim()
        if (path) return { path }
        return { error: 'cannot read desktop wallpaper' }
      }
      if (process.platform === 'linux') {
        const stdout = await exec('gsettings', ['get', 'org.gnome.desktop.background', 'picture-uri'])
        const uri = stdout.trim().replace(/^'|'$/g, '')
        if (uri.startsWith('file://')) {
          const path = decodeURIComponent(uri.slice('file://'.length))
          if (path) return { path }
        }
        return { error: 'cannot read desktop wallpaper' }
      }
      return { error: 'unsupported platform' }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  })
  ipcMain.handle('set-ui-zoom', (event, zoomLevel: number) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      // Clamp between 0.5 (50%) and 1.5 (150%)
      const clamped = Math.min(1.5, Math.max(0.5, zoomLevel / 100))
      window.webContents.setZoomFactor(clamped)
    }
  })
  ipcMain.handle('control', (event, operation: Operation) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      switch (operation) {
        case Operation.Maximize:
          if (window.maximizable) {
            if (currentPlatform === 'darwin') {
              window.fullScreen = !window.fullScreen
            } else {
              if (!window.isMaximized()) {
                window.maximize()
              } else {
                window.unmaximize()
              }
            }
            return true
          }
          return false
        case Operation.Minimize:
          if (window.minimizable) {
            // On Niri compositor, minimize can cause freezes/crashes.
            // Skip the minimize action in this case.
            if (isNiri) {
              return false
            }
            window.minimize()
            return true
          }
          return false
        case Operation.Hide:
          if (window.isVisible()) {
            window.hide()
            return true
          }
          return false
        case Operation.Show:
          if (!window.isVisible()) {
            window.show()
            return true
          }
          return false
        case Operation.Close:
          if (this.parking) {
            window.hide()
          } else {
            window.close()
          }
          return true
      }
    }
    return false
  })
}
