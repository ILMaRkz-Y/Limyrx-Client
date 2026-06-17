import { onUnmounted, ref } from 'vue'
import { fbGet, fbSet, fbRemove } from './firebase'

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
      await fbSet(`presence/${instanceId}`, { username: currentUser || 'anonymous', lastSeen: Date.now() })
    } catch {
      // silently fail
    }
  }

  async function pollCount() {
    try {
      const data = await fbGet<Record<string, { username: string; lastSeen: number }>>('presence')
      const now = Date.now()
      const list: OnlinePlayer[] = []
      if (data) {
        for (const key of Object.keys(data)) {
          if (now - data[key].lastSeen < STALE_MS) {
            list.push({ id: key, username: data[key].username, lastSeen: data[key].lastSeen })
          }
        }
      }
      list.sort((a, b) => b.lastSeen - a.lastSeen)
      online.value = list.length > 0
      playerCount.value = list.length
      players.value = list
    } catch {
      online.value = false
      playerCount.value = 0
      players.value = []
    } finally {
      loading.value = false
    }
  }

  async function removePresence() {
    try {
      await fbRemove(`presence/${instanceId}`)
    } catch {
      // silently fail
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
