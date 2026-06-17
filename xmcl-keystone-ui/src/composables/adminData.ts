import { computed, ref, onUnmounted } from 'vue'
import { fbGet, fbSet, fbPush, fbRemove } from './firebase'

const READ_STORAGE_KEY = 'xmcl_notification_read'

export interface AdminServer {
  id: string
  name: string
  host: string
  port: number
  imageUrl?: string
}
export interface AdminNews {
  id: string
  title: string
  description: string
  imageUrl: string
  date: string
  tag: string
}
export interface NewsTag {
  id: string
  name: string
  color: string
  title: string
}

export interface AdminNotification {
  id: string
  title: string
  message: string
  active: boolean
  date: string
}

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function setReadIds(ids: string[]) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

// Shared state across all callers (singleton pattern)
const _newsList = ref<AdminNews[]>([])
const _tagsList = ref<NewsTag[]>([])
const _serversList = ref<AdminServer[]>([])
const _notification = ref<AdminNotification>({ id: '', title: '', message: '', active: false, date: '' })
const _notificationHistory = ref<AdminNotification[]>([])
const _readIds = ref(getReadIds())
const _unreadCount = computed(() => {
  const ids = _readIds.value
  let count = 0
  if (_notification.value.active && _notification.value.id && !ids.includes(_notification.value.id)) {
    count++
  }
  for (const n of _notificationHistory.value) {
    if (n.id && !ids.includes(n.id)) {
      count++
    }
  }
  return count
})
let _pollTimer: ReturnType<typeof setInterval> | null = null
let _refCount = 0

function getSharedState() {
  return { newsList: _newsList, tagsList: _tagsList, serversList: _serversList, notification: _notification, notificationHistory: _notificationHistory, readIds: _readIds, unreadCount: _unreadCount }
}

async function fetchNotification() {
  try {
    const val = await fbGet<any>('currentNotification')
    if (_notification) {
      _notification.value = val || { id: '', title: '', message: '', active: false, date: '' }
    }
  } catch {}
}

async function fetchNotificationHistory() {
  try {
    const val = await fbGet<any>('notificationHistory')
    if (val && typeof val === 'object') {
      const arr: AdminNotification[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.id) {
          arr.push(item)
        }
      }
      arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      _notificationHistory.value = arr
    } else {
      _notificationHistory.value = []
    }
  } catch {}
}

async function fetchServers() {
  try {
    const val = await fbGet<any>('servers')
    if (val && typeof val === 'object') {
      const arr: AdminServer[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.id) {
          arr.push(item)
        }
      }
      _serversList.value = arr
    } else {
      _serversList.value = []
    }
  } catch {}
}

async function fetchTags() {
  try {
    const val = await fbGet<any>('tags')
    if (val && typeof val === 'object') {
      const arr: NewsTag[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.id) {
          arr.push(item)
        }
      }
      _tagsList.value = arr
    } else {
      _tagsList.value = []
    }
  } catch {}
}

async function fetchNews() {
  try {
    const val = await fbGet<any>('news')
    if (val && typeof val === 'object') {
      const arr: AdminNews[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.id) {
          arr.push(item)
        }
      }
      _newsList.value = arr
    } else {
      _newsList.value = []
    }
  } catch {}
}

async function pollAll() {
  await Promise.all([fetchNotification(), fetchNotificationHistory(), fetchNews(), fetchServers(), fetchTags()])
}

function startPolling() {
  if (_pollTimer) return
  pollAll()
  _pollTimer = setInterval(pollAll, 30000)
}

function stopPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer)
    _pollTimer = null
  }
}

export function useAdminData() {
  const state = getSharedState()
  _refCount++

  if (_refCount === 1) {
    startPolling()
  }

  onUnmounted(() => {
    _refCount--
    if (_refCount === 0) {
      stopPolling()
    }
  })

  function refreshReadState() {
    _readIds.value = getReadIds()
  }

  function isRead(id: string): boolean {
    if (!id) return true
    return _readIds.value.includes(id)
  }

  function markAsRead(id: string) {
    const ids = getReadIds()
    if (!ids.includes(id)) {
      ids.push(id)
      setReadIds(ids)
      _readIds.value = ids
    }
  }

  function markAllAsRead() {
    const ids: string[] = []
    if (_notification.value.active && _notification.value.id) {
      ids.push(_notification.value.id)
    }
    for (const n of _notificationHistory.value) {
      if (n.id) ids.push(n.id)
    }
    setReadIds(ids)
    _readIds.value = ids
  }

  async function loadData() {
    await pollAll()
  }

  async function saveNews(news: AdminNews[]) {
    try {
      const data: Record<string, AdminNews> = {}
      for (const item of news) {
        data[item.id] = item
      }
      await fbSet('news', data)
      _newsList.value = news
    } catch {
      // fail silently
    }
  }

  async function addNews(item: Omit<AdminNews, 'id'>) {
    const news: AdminNews = { ...item, id: Date.now().toString() }
    try {
      await fbSet(`news/${news.id}`, news)
    } catch {
      // fail silently
    }
  }

  async function addTag(item: Omit<NewsTag, 'id'>) {
    const tag: NewsTag = { ...item, id: Date.now().toString() }
    try {
      await fbSet('tags/' + tag.id, tag)
    } catch {}
  }

  async function removeTag(id: string) {
    try {
      await fbRemove('tags/' + id)
    } catch {}
  }

  async function saveTags(tags: NewsTag[]) {
    try {
      const data: Record<string, NewsTag> = {}
      for (const item of tags) {
        data[item.id] = item
      }
      await fbSet('tags', data)
      _tagsList.value = tags
    } catch {}
  }

  async function addServer(item: Omit<AdminServer, 'id'>) {
    const server: AdminServer = { ...item, id: Date.now().toString() }
    try {
      await fbSet('servers/' + server.id, server)
    } catch {}
  }

  async function removeServer(id: string) {
    try {
      await fbRemove('servers/' + id)
    } catch {}
  }

  async function updateServer(server: AdminServer) {
    try {
      await fbSet('servers/' + server.id, server)
    } catch {}
  }

  async function updateNews(news: AdminNews) {
    try {
      await fbSet('news/' + news.id, news)
    } catch {}
  }

  async function removeNews(id: string) {
    try {
      await fbRemove(`news/${id}`)
    } catch {
      // fail silently
    }
  }

  async function saveNotification(notif: Omit<AdminNotification, 'id' | 'date'>) {
    const full: AdminNotification = {
      ...notif,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }
    try {
      await fbSet('currentNotification', full)
      await fbPush('notificationHistory', full)
      _notification.value = full
      refreshReadState()
      await fetchNotificationHistory()
    } catch {
      // fail silently
    }
  }

  async function dismissNotification() {
    try {
      await fbSet('currentNotification', { id: '', title: '', message: '', active: false, date: '' })
      _notification.value = { id: '', title: '', message: '', active: false, date: '' }
    } catch {
      // fail silently
    }
  }

  return {
    newsList: state.newsList,
    tagsList: state.tagsList,
    serversList: state.serversList,
    notification: state.notification,
    notificationHistory: state.notificationHistory,
    loading: computed(() => false),
    unreadCount: state.unreadCount,
    isRead,
    markAsRead,
    markAllAsRead,
    readIds: state.readIds,
    loadData,
    addNews,
    removeNews,
    saveNews,
    addTag,
    removeTag,
    saveTags,
    addServer,
    removeServer,
    updateServer,
    updateNews,
    saveNotification,
    dismissNotification,
  }
}
