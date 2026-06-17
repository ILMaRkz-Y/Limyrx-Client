import { LauncherAppPlugin } from '~/app'
import { InstanceService } from '~/instance'
import { LaunchService } from '~/launch'
import { LaunchService as ILaunchService } from '@xmcl/runtime-api'
import { GameSession, GameSessionCollection, SESSIONS_FILE } from '@xmcl/instance'
import { join } from 'path'
import { pathExists, readFile, writeFile } from 'fs-extra'

export const pluginUserPlaytime: LauncherAppPlugin = async (app) => {
  const launchService: ILaunchService = await app.registry.get(LaunchService)
  const instanceService = await app.registry.get(InstanceService)

  launchService.on('minecraft-start', (options) => {
    instanceService.editInstance({
      instancePath: options.gameDirectory,
      lastPlayedDate: Date.now(),
    })
  })

  launchService.on('minecraft-exit', (options) => {
    if (options.gameDirectory) {
      const instance = instanceService.state.all[options.gameDirectory]
      if (instance) {
        instanceService.editInstance({
          instancePath: options.gameDirectory,
          playtime: instance.playtime + options.duration,
        })
      }

      // Record a game session
      recordSession(options.gameDirectory, {
        startTime: Date.now() - options.duration,
        endTime: Date.now(),
        duration: options.duration,
        minecraftVersion: (options as any).minecraft || '',
        exitCode: (options as any).code,
      }).catch(() => {})
    }
  })
}

async function recordSession(instancePath: string, session: GameSession): Promise<void> {
  const sessionsFile = join(instancePath, SESSIONS_FILE)
  let collection: GameSessionCollection = { sessions: [] }

  try {
    if (await pathExists(sessionsFile)) {
      const data = await readFile(sessionsFile, 'utf-8')
      collection = JSON.parse(data)
    }
  } catch {
    // Corrupted or missing file, start fresh
  }

  collection.sessions.push(session)

  // Keep only last 50 sessions to prevent unbounded growth
  if (collection.sessions.length > 50) {
    collection.sessions = collection.sessions.slice(-50)
  }

  await writeFile(sessionsFile, JSON.stringify(collection, null, 2))
}
