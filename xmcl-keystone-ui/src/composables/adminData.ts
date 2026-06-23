import { computed, ref, onUnmounted } from 'vue'
import { supabaseSelect, supabaseGet, supabaseInsert, supabaseUpdate, supabaseDelete, TABLES } from './supabase'

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

// New interfaces for extended stats
export interface PlayerAggregate {
  id: string
  username: string
  total_playtime: number
  last_seen: string
  favorite_server?: string
  updated_at: string
}

export interface ServerHourly {
  id: string
  server_id: string
  timestamp: string
  online: boolean
  player_count: number
  latency_ms?: number
  created_at: string
}

// ── Admin Enhancement: Server Details ──
export interface ServerDetail {
  id: string
  server_id: string
  version?: string
  modpack?: string
  game_mode?: string
  difficulty?: string
  max_players: number
  motd?: string
  favicon_url?: string
  last_polled: string
  created_at: string
  updated_at: string
}

// ── Admin Enhancement: User Sessions ──
export interface UserSession {
  id: string
  username: string
  session_id: string
  server_id?: string
  version?: string
  join_time: string
  leave_time?: string
  duration_seconds?: number
  ip_address?: string
  country_code?: string
  created_at: string
}

// ── Admin Enhancement: Launcher Settings (key-value) ──
export interface LauncherSetting {
  id: string
  key: string
  value: string
  description?: string
  updated_by?: string
  updated_at: string
  created_at: string
}

// ── Admin Enhancement: Moderation Logs ──
export interface ModerationLog {
  id: string
  admin_id: string
  target_username: string
  action_type: 'ban' | 'unban' | 'kick' | 'warn' | 'mute' | 'unmute'
  reason?: string
  server_id?: string
  expires_at?: string
  created_at: string
}

// ── Admin Enhancement: Feedback Tickets ──
export interface FeedbackTicket {
  id: string
  username: string
  email?: string
  subject: string
  message: string
  category: 'bug' | 'feature' | 'question' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

// ── Enhanced columns on existing tables ──
export interface EnhancedServer {
  // Extends AdminServer with enhanced columns
  motd?: string
  version?: string
  favicon_url?: string
  player_list?: string // JSON array
}

export interface EnhancedNotification {
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
}

export interface EnhancedNews {
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
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
// New state for extended stats
const _playerAggregates = ref<PlayerAggregate[]>([])
const _serverHourly = ref<ServerHourly[]>([])

// ── Admin Enhancement state ──
const _serverDetails = ref<ServerDetail[]>([])
const _userSessions = ref<UserSession[]>([])
const _launcherSettings = ref<LauncherSetting[]>([])
const _moderationLogs = ref<ModerationLog[]>([])
const _feedbackTickets = ref<FeedbackTicket[]>([])

let _pollTimer: ReturnType<typeof setInterval> | null = null
let _refCount = 0

function getSharedState() {
  return {
    newsList: _newsList,
    tagsList: _tagsList,
    serversList: _serversList,
    notification: _notification,
    notificationHistory: _notificationHistory,
    readIds: _readIds,
    unreadCount: _unreadCount,
    playerAggregates: _playerAggregates,
    serverHourly: _serverHourly,
    serverDetails: _serverDetails,
    userSessions: _userSessions,
    launcherSettings: _launcherSettings,
    moderationLogs: _moderationLogs,
    feedbackTickets: _feedbackTickets,
  }
}

async function fetchNotification() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.NOTIFICATIONS, {
      filters: { active: 'eq.true' },
      order: 'date',
      ascending: false,
      limit: 1,
    })
    if (data && data.length > 0) {
      const row = data[0]
      _notification.value = {
        id: row.id,
        title: row.title,
        message: row.message,
        active: row.active,
        date: row.date,
      }
    } else {
      _notification.value = { id: '', title: '', message: '', active: false, date: '' }
    }
  } catch (e) {
    console.warn('[adminData] fetchNotification failed', e)
  }
}

async function fetchNotificationHistory() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.NOTIFICATIONS, {
      order: 'date',
      ascending: false,
    })
    _notificationHistory.value = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      active: row.active,
      date: row.date,
    }))
  } catch (e) {
    console.warn('[adminData] fetchNotificationHistory failed', e)
    _notificationHistory.value = []
  }
}

async function fetchServers() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.SERVERS, {
      order: 'name',
      ascending: true,
    })
    _serversList.value = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port ?? 25565,
      imageUrl: row.image_url ?? undefined,
    }))
  } catch (e) {
    console.warn('[adminData] fetchServers failed', e)
    _serversList.value = []
  }
}

async function fetchTags() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.TAGS, {
      order: 'name',
      ascending: true,
    })
    _tagsList.value = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      title: row.title ?? row.name,
    }))
  } catch (e) {
    console.warn('[adminData] fetchTags failed', e)
    _tagsList.value = []
  }
}

async function fetchNews() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.NEWS, {
      order: 'date',
      ascending: false,
    })
    _newsList.value = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      imageUrl: row.image_url ?? '',
      date: row.date,
      tag: row.tag,
    }))
  } catch (e) {
    console.warn('[adminData] fetchNews failed', e)
    _newsList.value = []
  }
}

// New fetch functions for extended stats
async function fetchPlayerAggregates() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.PLAYER_AGGREGATES, {
      order: 'total_playtime',
      ascending: false,
    })
    _playerAggregates.value = (data ?? []).map((row: any) => ({
      id: row.id,
      username: row.username,
      total_playtime: row.total_playtime,
      last_seen: row.last_seen,
      favorite_server: row.favorite_server,
      updated_at: row.updated_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchPlayerAggregates failed', e)
    _playerAggregates.value = []
  }
}

async function fetchServerHourly(limit = 168) { // default last week (hourly)
  try {
    const data = await supabaseSelect<any[]>(TABLES.SERVER_HOURLY, {
      order: 'timestamp',
      ascending: false,
      limit,
    })
    _serverHourly.value = (data ?? []).map((row: any) => ({
      id: row.id,
      server_id: row.server_id,
      timestamp: row.timestamp,
      online: row.online,
      player_count: row.player_count,
      latency_ms: row.latency_ms,
      created_at: row.created_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchServerHourly failed', e)
    _serverHourly.value = []
  }
}

// ── Admin Enhancement: Fetch ──

async function fetchServerDetails() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.SERVER_DETAILS, {
      order: 'last_polled',
      ascending: false,
    })
    _serverDetails.value = (data ?? []).map((row: any) => ({
      id: row.id,
      server_id: row.server_id,
      version: row.version,
      modpack: row.modpack,
      game_mode: row.game_mode,
      difficulty: row.difficulty,
      max_players: row.max_players ?? 20,
      motd: row.motd,
      favicon_url: row.favicon_url,
      last_polled: row.last_polled,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchServerDetails failed', e)
    _serverDetails.value = []
  }
}

async function fetchUserSessions(options?: { limit?: number }) {
  try {
    const data = await supabaseSelect<any[]>(TABLES.USER_SESSIONS, {
      order: 'join_time',
      ascending: false,
      limit: options?.limit ?? 200,
    })
    _userSessions.value = (data ?? []).map((row: any) => ({
      id: row.id,
      username: row.username,
      session_id: row.session_id,
      server_id: row.server_id,
      version: row.version,
      join_time: row.join_time,
      leave_time: row.leave_time,
      duration_seconds: row.duration_seconds,
      ip_address: row.ip_address,
      country_code: row.country_code,
      created_at: row.created_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchUserSessions failed', e)
    _userSessions.value = []
  }
}

async function fetchLauncherSettings() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.LAUNCHER_SETTINGS, {
      order: 'key',
      ascending: true,
    })
    _launcherSettings.value = (data ?? []).map((row: any) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
      created_at: row.created_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchLauncherSettings failed', e)
    _launcherSettings.value = []
  }
}

async function fetchModerationLogs() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.MODERATION_LOGS, {
      order: 'created_at',
      ascending: false,
    })
    _moderationLogs.value = (data ?? []).map((row: any) => ({
      id: row.id,
      admin_id: row.admin_id,
      target_username: row.target_username,
      action_type: row.action_type,
      reason: row.reason,
      server_id: row.server_id,
      expires_at: row.expires_at,
      created_at: row.created_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchModerationLogs failed', e)
    _moderationLogs.value = []
  }
}

async function fetchFeedbackTickets() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.FEEDBACK_TICKETS, {
      order: 'created_at',
      ascending: false,
    })
    _feedbackTickets.value = (data ?? []).map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      subject: row.subject,
      message: row.message,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigned_to: row.assigned_to,
      resolved_at: row.resolved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (e) {
    console.warn('[adminData] fetchFeedbackTickets failed', e)
    _feedbackTickets.value = []
  }
}

// ── Admin Enhancement: CRUD helpers ──

async function upsertServerDetail(serverId: string, data: Partial<ServerDetail>) {
  try {
    const existing = await supabaseGet<ServerDetail>(TABLES.SERVER_DETAILS, { server_id: serverId }, { select: '*' })
    const payload = {
      server_id: serverId,
      version: data.version ?? existing?.version,
      modpack: data.modpack ?? existing?.modpack,
      game_mode: data.game_mode ?? existing?.game_mode,
      difficulty: data.difficulty ?? existing?.difficulty,
      max_players: data.max_players ?? existing?.max_players ?? 20,
      motd: data.motd ?? existing?.motd,
      favicon_url: data.favicon_url ?? existing?.favicon_url,
      last_polled: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (existing?.id) {
      await supabaseUpdate(TABLES.SERVER_DETAILS, { server_id: serverId }, payload)
    } else {
      await supabaseInsert(TABLES.SERVER_DETAILS, payload)
    }
    await fetchServerDetails()
  } catch (e) {
    console.warn('[adminData] upsertServerDetail failed', e)
  }
}

async function logUserSession(session: {
  username: string
  session_id: string
  server_id?: string
  version?: string
  ip_address?: string
}) {
  try {
    await supabaseInsert(TABLES.USER_SESSIONS, {
      username: session.username,
      session_id: session.session_id,
      server_id: session.server_id,
      version: session.version,
      join_time: new Date().toISOString(),
      ip_address: session.ip_address,
    })
  } catch (e) {
    console.warn('[adminData] logUserSession failed', e)
  }
}

async function updateSessionEnd(sessionId: string) {
  try {
    const existing = await supabaseGet<any>(TABLES.USER_SESSIONS, { session_id: sessionId }, { select: '*' })
    if (!existing) return
    const leaveTime = new Date().toISOString()
    const joinTime = new Date(existing.join_time).getTime()
    const durationSeconds = Math.floor((Date.now() - joinTime) / 1000)
    await supabaseUpdate(TABLES.USER_SESSIONS, { session_id: sessionId }, {
      leave_time: leaveTime,
      duration_seconds: durationSeconds,
    })
  } catch (e) {
    console.warn('[adminData] updateSessionEnd failed', e)
  }
}

async function upsertLauncherSetting(key: string, value: string, description?: string, updatedBy?: string) {
  try {
    const existing = await supabaseGet<LauncherSetting>(TABLES.LAUNCHER_SETTINGS, { key }, { select: '*' })
    const payload = {
      value,
      description: description ?? existing?.description,
      updated_by: updatedBy ?? existing?.updated_by,
      updated_at: new Date().toISOString(),
    }
    if (existing?.id) {
      await supabaseUpdate(TABLES.LAUNCHER_SETTINGS, { key }, payload)
    } else {
      await supabaseInsert(TABLES.LAUNCHER_SETTINGS, {
        key,
        value,
        description,
        updated_by: updatedBy,
      })
    }
    await fetchLauncherSettings()
  } catch (e) {
    console.warn('[adminData] upsertLauncherSetting failed', e)
  }
}

async function deleteLauncherSetting(id: string) {
  try {
    await supabaseDelete(TABLES.LAUNCHER_SETTINGS, { id })
    await fetchLauncherSettings()
  } catch (e) {
    console.warn('[adminData] deleteLauncherSetting failed', e)
  }
}

async function createModerationLog(log: {
  admin_id: string
  target_username: string
  action_type: ModerationLog['action_type']
  reason?: string
  server_id?: string
  expires_at?: string
}) {
  try {
    await supabaseInsert(TABLES.MODERATION_LOGS, log)
    await fetchModerationLogs()
  } catch (e) {
    console.warn('[adminData] createModerationLog failed', e)
  }
}

async function updateFeedbackTicket(id: string, updates: Partial<FeedbackTicket>) {
  try {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (updates.status) payload.status = updates.status
    if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to || null
    if (updates.priority) payload.priority = updates.priority
    if (updates.category) payload.category = updates.category
    if (updates.resolved_at !== undefined) payload.resolved_at = updates.resolved_at || null
    if (updates.status === 'resolved' || updates.status === 'closed') {
      payload.resolved_at = payload.resolved_at ?? new Date().toISOString()
    }
    await supabaseUpdate(TABLES.FEEDBACK_TICKETS, { id }, payload)
    await fetchFeedbackTickets()
  } catch (e) {
    console.warn('[adminData] updateFeedbackTicket failed', e)
  }
}

async function deleteFeedbackTicket(id: string) {
  try {
    await supabaseDelete(TABLES.FEEDBACK_TICKETS, { id })
    await fetchFeedbackTickets()
  } catch (e) {
    console.warn('[adminData] deleteFeedbackTicket failed', e)
  }
}

// Function to log server status (call from elsewhere, e.g., after fetching from mcsrvstat.us)
async function logServerStatus(serverId: string, online: boolean, playerCount: number, latencyMs?: number) {
  try {
    await supabaseInsert(TABLES.SERVER_HOURLY, {
      server_id: serverId,
      timestamp: new Date().toISOString(),
      online,
      player_count: playerCount,
      latency_ms: latencyMs,
    })
  } catch (e) {
    console.warn('[adminData] logServerStatus failed', e)
  }
}

// Optional: update player aggregate (example: increment playtime)
async function updatePlayerAggregate(username: string, addPlaytimeSeconds: number, lastSeen?: string, favoriteServerId?: string) {
  try {
    // First, try to get existing record.
    // NOTE: supabaseGet() automatically adds `eq.` prefix — do NOT repeat it here.
    const existing = await supabaseGet<PlayerAggregate>(TABLES.PLAYER_AGGREGATES, { username }, { select: '*' })
    let updates: Partial<PlayerAggregate> = {
      total_playtime: (existing?.total_playtime ?? 0) + addPlaytimeSeconds,
      last_seen: lastSeen ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (favoriteServerId !== undefined) {
      updates.favorite_server = favoriteServerId
    }
    if (existing?.id) {
      await supabaseUpdate(TABLES.PLAYER_AGGREGATES, { id: existing.id }, updates)
    } else {
      // Insert new
      await supabaseInsert(TABLES.PLAYER_AGGREGATES, {
        username,
        total_playtime: addPlaytimeSeconds,
        last_seen: lastSeen ?? new Date().toISOString(),
        favorite_server: favoriteServerId,
        updated_at: new Date().toISOString(),
      })
    }
    // Refresh list
    await fetchPlayerAggregates()
  } catch (e) {
    console.warn('[adminData] updatePlayerAggregate failed', e)
  }
}

async function pollAll() {
  await Promise.all([
    fetchNotification(),
    fetchNotificationHistory(),
    fetchNews(),
    fetchServers(),
    fetchTags(),
    fetchPlayerAggregates(),
    fetchServerHourly(),
    fetchServerDetails(),
    fetchUserSessions(),
    fetchLauncherSettings(),
    fetchModerationLogs(),
    fetchFeedbackTickets(),
  ])
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
      // Strategy: insert/update each item individually via upsert.
      // Delete removed items (ones in old list but not in new list).
      const oldIds = new Set(_newsList.value.map(i => i.id))
      const newIds = new Set(news.filter(i => i.id).map(i => i.id))

      // Remove items that are no longer in the list
      for (const item of _newsList.value) {
        if (!newIds.has(item.id)) {
          try { await supabaseDelete(TABLES.NEWS, { id: item.id }) } catch {}
        }
      }

      // Upsert each news item
      for (const item of news) {
        if (item.id && oldIds.has(item.id)) {
          // Update existing
          await supabaseUpdate(TABLES.NEWS, { id: item.id }, {
            title: item.title,
            description: item.description || null,
            image_url: item.imageUrl || null,
            date: item.date || new Date().toISOString(),
            tag: item.tag || 'NEWS',
            updated_at: new Date().toISOString(),
          })
        } else {
          // Insert new
          await supabaseInsert(TABLES.NEWS, {
            title: item.title,
            description: item.description || null,
            image_url: item.imageUrl || null,
            date: item.date || new Date().toISOString(),
            tag: item.tag || 'NEWS',
          })
        }
      }

      // Refresh the local list
      await fetchNews()
    } catch (e) {
      console.warn('[adminData] saveNews failed', e)
    }
  }

  async function addNews(item: Omit<AdminNews, 'id'>) {
    try {
      await supabaseInsert(TABLES.NEWS, {
        title: item.title,
        description: item.description || null,
        image_url: item.imageUrl || null,
        date: item.date || new Date().toISOString(),
        tag: item.tag || 'NEWS',
      })
      await fetchNews()
    } catch (e) {
      console.warn('[adminData] addNews failed', e)
    }
  }

  async function addTag(item: Omit<NewsTag, 'id'>) {
    try {
      await supabaseInsert(TABLES.TAGS, {
        name: item.name,
        color: item.color || '#6366f1',
        title: item.title || item.name,
      })
      await fetchTags()
    } catch (e) {
      console.warn('[adminData] addTag failed', e)
    }
  }

  async function removeTag(id: string) {
    try {
      await supabaseDelete(TABLES.TAGS, { id })
      await fetchTags()
    } catch (e) {
      console.warn('[adminData] removeTag failed', e)
    }
  }

  async function saveTags(tags: NewsTag[]) {
    try {
      // Upsert each tag; delete removed ones
      const oldIds = new Set(_tagsList.value.map(i => i.id))
      const newIds = new Set(tags.filter(i => i.id).map(i => i.id))

      // Remove tags no longer in the list
      for (const item of _tagsList.value) {
        if (!newIds.has(item.id)) {
          try { await supabaseDelete(TABLES.TAGS, { id: item.id }) } catch {}
        }
      }

      for (const item of tags) {
        if (item.id && oldIds.has(item.id)) {
          await supabaseUpdate(TABLES.TAGS, { id: item.id }, {
            name: item.name,
            color: item.color,
            title: item.title || item.name,
          })
        } else {
          await supabaseInsert(TABLES.TAGS, {
            name: item.name,
            color: item.color,
            title: item.title || item.name,
          })
        }
      }

      await fetchTags()
    } catch (e) {
      console.warn('[adminData] saveTags failed', e)
    }
  }

  async function addServer(item: Omit<AdminServer, 'id'>) {
    try {
      await supabaseInsert(TABLES.SERVERS, {
        name: item.name,
        host: item.host,
        port: item.port || 25565,
        image_url: item.imageUrl || null,
      })
      await fetchServers()
    } catch (e) {
      console.warn('[adminData] addServer failed', e)
    }
  }

  async function removeServer(id: string) {
    try {
      await supabaseDelete(TABLES.SERVERS, { id })
      await fetchServers()
    } catch (e) {
      console.warn('[adminData] removeServer failed', e)
    }
  }

  async function updateServer(server: AdminServer) {
    try {
      await supabaseUpdate(TABLES.SERVERS, { id: server.id }, {
        name: server.name,
        host: server.host,
        port: server.port,
        image_url: server.imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      await fetchServers()
    } catch (e) {
      console.warn('[adminData] updateServer failed', e)
    }
  }

  async function updateNews(news: AdminNews) {
    try {
      await supabaseUpdate(TABLES.NEWS, { id: news.id }, {
        title: news.title,
        description: news.description || null,
        image_url: news.imageUrl || null,
        date: news.date,
        tag: news.tag,
        updated_at: new Date().toISOString(),
      })
      await fetchNews()
    } catch (e) {
      console.warn('[adminData] updateNews failed', e)
    }
  }

  async function removeNews(id: string) {
    try {
      await supabaseDelete(TABLES.NEWS, { id })
      await fetchNews()
    } catch (e) {
      console.warn('[adminData] removeNews failed', e)
    }
  }

  async function saveNotification(notif: Omit<AdminNotification, 'id' | 'date'>) {
    try {
      // Deactivate all current active notifications
      const activeNotifs = await supabaseSelect<any[]>(TABLES.NOTIFICATIONS, {
        filters: { active: 'eq.true' },
      })
      for (const n of activeNotifs ?? []) {
        await supabaseUpdate(TABLES.NOTIFICATIONS, { id: n.id }, { active: false })
      }

      // Insert the new notification
      const row = await supabaseInsert<any>(TABLES.NOTIFICATIONS, {
        title: notif.title,
        message: notif.message,
        active: true,
        date: new Date().toISOString(),
      })

      _notification.value = {
        id: row.id,
        title: row.title,
        message: row.message,
        active: row.active,
        date: row.date,
      }
      refreshReadState()
      await fetchNotificationHistory()
    } catch (e) {
      console.warn('[adminData] saveNotification failed', e)
    }
  }

  async function dismissNotification() {
    try {
      const activeNotifs = await supabaseSelect<any[]>(TABLES.NOTIFICATIONS, {
        filters: { active: 'eq.true' },
      })
      for (const n of activeNotifs ?? []) {
        await supabaseUpdate(TABLES.NOTIFICATIONS, { id: n.id }, { active: false })
      }
      _notification.value = { id: '', title: '', message: '', active: false, date: '' }
    } catch (e) {
      console.warn('[adminData] dismissNotification failed', e)
    }
  }

  return {
    newsList: state.newsList,
    tagsList: state.tagsList,
    serversList: state.serversList,
    notification: state.notification,
    notificationHistory: state.notificationHistory,
    playerAggregates: state.playerAggregates,
    serverHourly: state.serverHourly,
    serverDetails: state.serverDetails,
    userSessions: state.userSessions,
    launcherSettings: state.launcherSettings,
    moderationLogs: state.moderationLogs,
    feedbackTickets: state.feedbackTickets,
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
    // New methods for extended stats
    fetchPlayerAggregates,
    fetchServerHourly,
    logServerStatus,
    updatePlayerAggregate,
    // Admin Enhancement methods
    fetchServerDetails,
    fetchUserSessions,
    fetchLauncherSettings,
    fetchModerationLogs,
    fetchFeedbackTickets,
    upsertServerDetail,
    logUserSession,
    updateSessionEnd,
    upsertLauncherSetting,
    deleteLauncherSetting,
    createModerationLog,
    updateFeedbackTicket,
    deleteFeedbackTicket,
  }
}