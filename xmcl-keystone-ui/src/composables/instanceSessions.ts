import { InstanceServiceKey } from '@xmcl/runtime-api'
import type { GameSession } from '@xmcl/instance'
import { useService } from './service'
import type { Instance } from '@xmcl/instance'

export function useSessions() {
  const { getInstanceSessions } = useService(InstanceServiceKey)

  async function getAllSessions(instances: Instance[]): Promise<{ instance: Instance; sessions: GameSession[] }[]> {
    const results = await Promise.allSettled(
      instances.map(async (inst) => {
        const collection = await getInstanceSessions(inst.path)
        return { instance: inst, sessions: collection.sessions }
      }),
    )
    return results
      .filter((r): r is PromiseFulfilledResult<{ instance: Instance; sessions: GameSession[] }> => r.status === 'fulfilled')
      .map((r) => r.value)
  }

  async function getInstanceSessionsFor(instancePath: string): Promise<GameSession[]> {
    try {
      const collection = await getInstanceSessions(instancePath)
      return collection.sessions
    } catch {
      return []
    }
  }

  return {
    getAllSessions,
    getInstanceSessionsFor,
  }
}
