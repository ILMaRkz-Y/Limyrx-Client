import { ref } from 'vue'
import { supabaseSelect, supabaseInsert, supabaseUpdate, supabaseDelete, TABLES } from './supabase'

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
    const data = await supabaseSelect<any[]>(TABLES.SKINS, {
      order: 'date',
      ascending: false,
    })
    _skinList.value = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      model: row.model,
      skinUrl: row.skin_url,
      capeUrl: row.cape_url ?? undefined,
      date: row.date,
    }))
  } catch (e) {
    console.warn('[skinData] fetchSkins failed', e)
    _skinList.value = []
  }
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
    try {
      await supabaseInsert(TABLES.SKINS, {
        name: item.name,
        model: item.model,
        skin_url: item.skinUrl,
        cape_url: item.capeUrl || null,
        date: new Date().toISOString(),
      })
      await fetchSkins()
    } catch (e) {
      console.warn('[skinData] addSkin failed', e)
    }
  }

  async function updateSkin(id: string, data: Partial<SkinEntry>) {
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (data.name !== undefined) updates.name = data.name
      if (data.model !== undefined) updates.model = data.model
      if (data.skinUrl !== undefined) updates.skin_url = data.skinUrl
      if (data.capeUrl !== undefined) updates.cape_url = data.capeUrl || null

      await supabaseUpdate(TABLES.SKINS, { id }, updates)
      await fetchSkins()
    } catch (e) {
      console.warn('[skinData] updateSkin failed', e)
    }
  }

  async function removeSkin(id: string) {
    try {
      await supabaseDelete(TABLES.SKINS, { id })
      await fetchSkins()
    } catch (e) {
      console.warn('[skinData] removeSkin failed', e)
    }
  }

  async function saveSkins(skins: SkinEntry[]) {
    try {
      // Upsert each skin; delete removed ones
      const oldIds = new Set(_skinList.value.map(i => i.id))
      const newIds = new Set(skins.filter(i => i.id).map(i => i.id))

      // Remove skins no longer in the list
      for (const item of _skinList.value) {
        if (!newIds.has(item.id)) {
          try { await supabaseDelete(TABLES.SKINS, { id: item.id }) } catch {}
        }
      }

      for (const item of skins) {
        if (item.id && oldIds.has(item.id)) {
          await supabaseUpdate(TABLES.SKINS, { id: item.id }, {
            name: item.name,
            model: item.model,
            skin_url: item.skinUrl,
            cape_url: item.capeUrl || null,
            updated_at: new Date().toISOString(),
          })
        } else {
          await supabaseInsert(TABLES.SKINS, {
            name: item.name,
            model: item.model,
            skin_url: item.skinUrl,
            cape_url: item.capeUrl || null,
            date: item.date || new Date().toISOString(),
          })
        }
      }

      await fetchSkins()
    } catch (e) {
      console.warn('[skinData] saveSkins failed', e)
    }
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
