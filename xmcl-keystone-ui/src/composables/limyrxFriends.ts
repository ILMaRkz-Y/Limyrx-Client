import { computed, InjectionKey, reactive, ref, watch } from 'vue'
import { kUserContext } from '@/composables/user'
import { injection } from '@/util/inject'
import { useIntervalFn } from '@vueuse/core'

function uid(): string { return crypto.randomUUID() }

export type LimyrxStatus = 'online' | 'idle' | 'dnd' | 'offline'

export interface LimyrxUserProfile {
  profileId: string
  displayName: string
  status: LimyrxStatus
  lastSeen: number
  createdAt: number
}

export interface LimyrxFriend {
  id: string
  profileId: string
  displayName: string
  status: LimyrxStatus
  lastSeen: number
  addedAt: number
}

export interface LimyrxFriendRequest {
  id: string
  fromProfileId: string
  fromDisplayName: string
  toProfileId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: number
}

export interface LimyrxChatMessage {
  id: string
  chatId: string
  fromProfileId: string
  text: string
  createdAt: number
  read: boolean
}

export interface LimyrxChat {
  id: string
  participants: string[]
  displayNames: string[]
  lastMessage?: string
  lastMessageAt?: number
  unreadCount: number
  createdAt: number
}

const STORAGE_PROFILES = 'limyrx-profiles'
const STORAGE_FRIENDS = 'limyrx-friends'
const STORAGE_REQUESTS = 'limyrx-requests'
const STORAGE_CHATS = 'limyrx-chats'
const STORAGE_MESSAGES = 'limyrx-messages'
const STORAGE_MY_STATUS = 'limyrx-my-status'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

function now() { return Date.now() }

export function useLimyrxFriendsImpl() {
  const { gameProfile, userProfile } = injection(kUserContext)

  const myProfileId = computed(() => gameProfile.value?.name || userProfile.value?.username || 'unknown')
  const myDisplayName = computed(() => gameProfile.value?.name || userProfile.value?.username || 'Unknown')

  const profiles = reactive<Record<string, LimyrxUserProfile>>(load(STORAGE_PROFILES, {}))
  const friends = reactive<Record<string, LimyrxFriend>>(load(STORAGE_FRIENDS, {}))
  const requests = reactive<Record<string, LimyrxFriendRequest>>(load(STORAGE_REQUESTS, {}))
  const chats = reactive<Record<string, LimyrxChat>>(load(STORAGE_CHATS, {}))
  const messages = reactive<Record<string, LimyrxChatMessage[]>>(load(STORAGE_MESSAGES, {}))

  const myStatus = ref<LimyrxStatus>(load(STORAGE_MY_STATUS, 'online'))

  let _persistPending = false
  function persistAll() {
    // Debounce: coalesce multiple calls within the same microtask into a single write
    if (_persistPending) return
    _persistPending = true
    queueMicrotask(() => {
      _persistPending = false
      save(STORAGE_PROFILES, { ...profiles })
      save(STORAGE_FRIENDS, { ...friends })
      save(STORAGE_REQUESTS, { ...requests })
      save(STORAGE_CHATS, { ...chats })
      save(STORAGE_MESSAGES, { ...messages })
      save(STORAGE_MY_STATUS, myStatus.value)
    })
  }

function reloadAll() {
  const p = load<Record<string, LimyrxUserProfile>>(STORAGE_PROFILES, {})
  Object.assign(profiles, p)
  const f = load<Record<string, LimyrxFriend>>(STORAGE_FRIENDS, {})
  Object.assign(friends, f)
  const r = load<Record<string, LimyrxFriendRequest>>(STORAGE_REQUESTS, {})
  Object.assign(requests, r)
  const c = load<Record<string, LimyrxChat>>(STORAGE_CHATS, {})
  Object.assign(chats, c)
  const m = load<Record<string, LimyrxChatMessage[]>>(STORAGE_MESSAGES, {})
  Object.assign(messages, m)
  myStatus.value = load<LimyrxStatus>(STORAGE_MY_STATUS, 'online')
}

function ensureMyProfile() {
  const id = myProfileId.value
  if (!id || profiles[id]) return
  profiles[id] = {
    profileId: id,
    displayName: myDisplayName.value,
    status: myStatus.value,
    lastSeen: now(),
    createdAt: now(),
  }
  persistAll()
}

  function setStatus(status: LimyrxStatus) {
    myStatus.value = status
    const id = myProfileId.value
    if (profiles[id]) {
      profiles[id].status = status
      profiles[id].lastSeen = now()
    }
    persistAll()
  }

  function getFriendStatus(profileId: string): LimyrxStatus {
    const p = profiles[profileId]
    if (!p) return 'offline'
    if (p.status === 'offline') return 'offline'
    if (now() - p.lastSeen > 120000) return 'offline'
    return p.status
  }

  const friendsList = computed(() =>
    Object.values(friends).sort((a, b) => a.addedAt - b.addedAt)
  )

  const friendProfiles = computed(() =>
    friendsList.value.map(f => ({
      ...f,
      status: getFriendStatus(f.profileId),
    }))
  )

  const incomingRequests = computed(() =>
    Object.values(requests).filter(r => r.toProfileId === myProfileId.value && r.status === 'pending')
  )

  const outgoingRequests = computed(() =>
    Object.values(requests).filter(r => r.fromProfileId === myProfileId.value && r.status === 'pending')
  )

  const incomingCount = computed(() => incomingRequests.value.length)

  function addFriend(displayName: string): string | null {
    ensureMyProfile()
    const pid = myProfileId.value

    const targetId = displayName.trim()
    if (!targetId) return 'Enter a name'

    if (targetId === pid) return 'Cannot add yourself'

    const exists = Object.values(friends).find(f => f.profileId === targetId || f.displayName === targetId)
    if (exists) return 'Already friends'

    const pending = Object.values(requests).find(
      r => r.fromProfileId === pid && r.toProfileId === targetId && r.status === 'pending'
    )
    if (pending) return 'Request already sent'

    if (!profiles[targetId]) {
      profiles[targetId] = {
        profileId: targetId,
        displayName: targetId,
        status: 'offline',
        lastSeen: 0,
        createdAt: now(),
      }
    }

    const req: LimyrxFriendRequest = {
      id: uid(),
      fromProfileId: pid,
      fromDisplayName: myDisplayName.value,
      toProfileId: targetId,
      status: 'pending',
      createdAt: now(),
    }
    requests[req.id] = req
    persistAll()
    return null
  }

  function acceptRequest(requestId: string) {
    const req = requests[requestId]
    if (!req) return

    req.status = 'accepted'

    const friendId1 = uid()
    friends[friendId1] = {
      id: friendId1,
      profileId: req.fromProfileId,
      displayName: req.fromDisplayName,
      status: 'online',
      lastSeen: now(),
      addedAt: now(),
    }

    const friendId2 = uid()
    friends[friendId2] = {
      id: friendId2,
      profileId: req.toProfileId,
      displayName: myDisplayName.value,
      status: myStatus.value,
      lastSeen: now(),
      addedAt: now(),
    }

    const chatId = uid()
    chats[chatId] = {
      id: chatId,
      participants: [req.fromProfileId, req.toProfileId],
      displayNames: [req.fromDisplayName, myDisplayName.value],
      unreadCount: 0,
      createdAt: now(),
    }

    persistAll()
  }

  function cancelRequest(requestId: string) {
    delete requests[requestId]
    persistAll()
  }

  function declineRequest(requestId: string) {
    const req = requests[requestId]
    if (!req) return
    req.status = 'declined'
    persistAll()
  }

  function removeFriend(friendId: string) {
    const f = friends[friendId]
    if (!f) return

    const otherSide = Object.values(friends).find(
      fr => fr.profileId === (f.profileId === myProfileId.value ? undefined : f.profileId)
    )

    delete friends[friendId]
    if (otherSide) delete friends[otherSide.id]

    persistAll()
  }

  const chatList = computed(() =>
    Object.values(chats)
      .filter(c => c.participants.includes(myProfileId.value))
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
  )

  function getOrCreateChat(targetProfileId: string): string {
    const existing = Object.values(chats).find(c =>
      c.participants.includes(myProfileId.value) &&
      c.participants.includes(targetProfileId)
    )
    if (existing) return existing.id

    const chatId = uid()
    const targetName = profiles[targetProfileId]?.displayName || targetProfileId
    chats[chatId] = {
      id: chatId,
      participants: [myProfileId.value, targetProfileId],
      displayNames: [myDisplayName.value, targetName],
      unreadCount: 0,
      createdAt: now(),
    }
    persistAll()
    return chatId
  }

  function sendMessage(chatId: string, text: string) {
    const chat = chats[chatId]
    if (!chat || !text.trim()) return

    const msg: LimyrxChatMessage = {
      id: uid(),
      chatId,
      fromProfileId: myProfileId.value,
      text: text.trim(),
      createdAt: now(),
      read: false,
    }

    if (!messages[chatId]) messages[chatId] = []
    messages[chatId].push(msg)

    chat.lastMessage = msg.text
    chat.lastMessageAt = msg.createdAt

    persistAll()
  }

  function getMessages(chatId: string): LimyrxChatMessage[] {
    return (messages[chatId] || []).slice(-100)
  }

  function markRead(chatId: string) {
    const msgs = messages[chatId]
    if (!msgs) return
    let changed = false
    for (const m of msgs) {
      if (m.fromProfileId !== myProfileId.value && !m.read) {
        m.read = true
        changed = true
      }
    }
    if (changed) {
      const chat = chats[chatId]
      if (chat) chat.unreadCount = 0
      persistAll()
    }
  }

  function getUnreadCount(chatId: string): number {
    return (messages[chatId] || []).filter(m => m.fromProfileId !== myProfileId.value && !m.read).length
  }

  const totalUnread = computed(() =>
    Object.keys(messages).reduce((sum, cid) => sum + getUnreadCount(cid), 0)
  )

  useIntervalFn(() => {
    const id = myProfileId.value
    if (profiles[id]) {
      profiles[id].lastSeen = now()
      persistAll()
    }
  }, 30000)

  watch(myProfileId, () => {
    ensureMyProfile()
    reloadAll()
  }, { immediate: true })

  function refresh() {
    reloadAll()
    ensureMyProfile()
  }

  return {
    myProfileId,
    myDisplayName,
    myStatus,
    profiles,
    friends,
    requests,
    friendsList,
    friendProfiles,
    incomingRequests,
    outgoingRequests,
    incomingCount,
    chats,
    chatList,
    messages,
    totalUnread,
    setStatus,
    addFriend,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
    getOrCreateChat,
    sendMessage,
    getMessages,
    markRead,
    getUnreadCount,
    // Admin: all chats & messages
    allChats: computed(() => Object.values(chats).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))),
    getAllMessages: (chatId: string) => messages[chatId] || [],
    refresh,
    adminSendAsUser: (chatId: string, text: string, asProfileId: string) => {
      const chat = chats[chatId]
      if (!chat || !text.trim()) return
      const msg: LimyrxChatMessage = {
        id: uid(),
        chatId,
        fromProfileId: asProfileId,
        text: text.trim(),
        createdAt: now(),
        read: false,
      }
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)
      chat.lastMessage = msg.text
      chat.lastMessageAt = msg.createdAt
      persistAll()
    },
  }
}

export type LimyrxFriendsInstance = ReturnType<typeof useLimyrxFriendsImpl>

export const kLimyrxFriends: InjectionKey<LimyrxFriendsInstance> = Symbol('LimyrxFriends')
