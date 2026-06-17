import { ref } from 'vue'
import { fbGet, fbSet, fbRemove } from './firebase'

export interface SkinEntry {
  id: string
  name: string
  model: 'classic' | 'slim'
  skinUrl: string
  capeUrl?: string
  date: string
}

const _skinList = ref<SkinEntry[]>([])
let _skinRefCount = 0
let _skinPollTimer: ReturnType<typeof setInterval> | null = null

async function fetchSkins() {
  try {
    const val = await fbGet<Record<string, SkinEntry>>('skins')
    if (val && typeof val === 'object') {
      const arr: SkinEntry[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.id) {
          arr.push(item)
        }
      }
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      _skinList.value = arr
    } else {
      _skinList.value = []
    }
  } catch {}
}

function startPolling() {
  if (_skinPollTimer) return
  fetchSkins()
  _skinPollTimer = setInterval(fetchSkins, 30000)
}

function stopPolling() {
  if (_skinPollTimer) {
    clearInterval(_skinPollTimer)
    _skinPollTimer = null
  }
}

export function useSkinData() {
  _skinRefCount++
  if (_skinRefCount === 1) {
    startPolling()
  }

  async function addSkin(item: Omit<SkinEntry, 'id' | 'date'>) {
    const skin: SkinEntry = {
      ...item,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }
    try {
      await fbSet('skins/' + skin.id, skin)
      await fetchSkins()
    } catch {}
    return skin
  }

  async function updateSkin(id: string, data: Partial<SkinEntry>) {
    try {
      const existing = _skinList.value.find((s) => s.id === id)
      if (existing) {
        await fbSet('skins/' + id, { ...existing, ...data })
        await fetchSkins()
      }
    } catch {}
  }

  async function removeSkin(id: string) {
    try {
      await fbRemove('skins/' + id)
      await fetchSkins()
    } catch {}
  }

  async function saveSkins(skins: SkinEntry[]) {
    try {
      const data: Record<string, SkinEntry> = {}
      for (const item of skins) {
        data[item.id] = item
      }
      await fbSet('skins', data)
      _skinList.value = skins
    } catch {}
  }

  return {
    skins: _skinList,
    addSkin,
    updateSkin,
    removeSkin,
    saveSkins,
    refresh: fetchSkins,
  }
}
