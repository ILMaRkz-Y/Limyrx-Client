import { onUnmounted, ref } from 'vue'
import { supabaseUpsert, supabaseSelect, supabaseDelete, TABLES } from './supabase'

const STALE_MS = 120_000

function getInstanceId(): string {
  let id = localStorage.getItem('xmcl_instance_id')
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('xmcl_instance_id', id)
  }
  return id
}

export interface OnlinePlayer {
  id: string
  username: string
  lastSeen: number
}

export function useOnlinePlayers() {
  const online = ref(false)
  const playerCount = ref(0)
  const players = ref<OnlinePlayer[]>([])
  const loading = ref(true)
  const instanceId = getInstanceId()
  let currentUser = ''
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function heartbeat() {
    try {
      await supabaseUpsert(TABLES.PRESENCE, {
        instance_id: instanceId,
        username: currentUser || 'anonymous',
        last_seen: new Date().toISOString(),
      }, 'instance_id')
    } catch (e) {
      console.warn('[presence] heartbeat failed', e)
    }
  }

  async function pollCount() {
    try {
      const cutoff = new Date(Date.now() - STALE_MS).toISOString()
      const data = await supabaseSelect<any[]>(TABLES.PRESENCE, {
        select: 'id,instance_id,username,last_seen',
        filters: { last_seen: `gte.${cutoff}` },
        order: 'last_seen',
        ascending: false,
      })

      const list: OnlinePlayer[] = (data ?? []).map((row: any) => ({
        id: row.instance_id,
        username: row.username,
        lastSeen: new Date(row.last_seen).getTime(),
      }))

      online.value = list.length > 0
      playerCount.value = list.length
      players.value = list
    } catch (e) {
      console.warn('[presence] poll failed', e)
      online.value = false
      playerCount.value = 0
      players.value = []
    } finally {
      loading.value = false
    }
  }

  async function removePresence() {
    try {
      await supabaseDelete(TABLES.PRESENCE, { instance_id: instanceId })
    } catch (e) {
      console.warn('[presence] remove failed', e)
    }
  }

  function start(username: string) {
    currentUser = username
    heartbeat()
    heartbeatTimer = setInterval(heartbeat, 30000)
  }

  function stop() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    removePresence()
  }

  pollCount()
  pollTimer = setInterval(pollCount, 15000)

  onUnmounted(() => {
    stop()
  })

  return {
    online,
    playerCount,
    players,
    loading,
    start,
    stop,
  }
}
