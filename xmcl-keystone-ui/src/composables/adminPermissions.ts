import { computed, ref, onUnmounted } from 'vue'
import { supabaseSelect, supabaseInsert, supabaseUpdate, supabaseDelete, TABLES } from './supabase'

export type AdminPermission = 'view' | 'edit' | 'owner'

export interface AdminUser {
  id: string
  name: string
  permission: AdminPermission
  addedAt: number
  addedBy: string
}

const _adminUsers = ref<AdminUser[]>([])
const _currentUserName = ref('')
const _pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const _refCount = ref(0)

// Fallback: the original hardcoded owner always has admin rights
const OWNER_FALLBACK = 'ilmarkz_'

async function fetchAdminUsers() {
  try {
    const data = await supabaseSelect<any[]>(TABLES.ADMIN_USERS, {
      order: 'name',
      ascending: true,
    })
    _adminUsers.value = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      permission: row.permission,
      addedAt: new Date(row.added_at).getTime(),
      addedBy: row.added_by,
    }))
  } catch (e) {
    console.warn('[adminPermissions] fetchAdminUsers failed', e)
    _adminUsers.value = []
  }
}

function startPolling() {
  if (_pollTimer.value) return
  fetchAdminUsers()
  _pollTimer.value = setInterval(fetchAdminUsers, 30000)
}

function stopPolling() {
  if (_pollTimer.value) {
    clearInterval(_pollTimer.value)
    _pollTimer.value = null
  }
}

export function useAdminPermissions() {
  _refCount.value++
  if (_refCount.value === 1) {
    startPolling()
  }

  onUnmounted(() => {
    _refCount.value--
    if (_refCount.value === 0) {
      stopPolling()
    }
  })

  function setCurrentUser(name: string) {
    _currentUserName.value = name?.toLowerCase() || ''
  }

  function getUser(name: string): AdminUser | undefined {
    return _adminUsers.value.find(u => u.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Fallback: if Supabase is empty, the hardcoded owner still gets access.
   * Once data loads, Supabase admins take precedence.
   */
  function hasFallbackAccess(): boolean {
    return _currentUserName.value === OWNER_FALLBACK
  }

  const isOwner = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return user.permission === 'owner'
    return hasFallbackAccess()
  })

  const canEdit = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return user.permission === 'edit' || user.permission === 'owner'
    return hasFallbackAccess()
  })

  const isAdmin = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return true
    return hasFallbackAccess()
  })

  const currentPermission = computed<AdminPermission | null>(() => {
    const user = getUser(_currentUserName.value)
    if (user) return user.permission
    if (hasFallbackAccess()) return 'owner'
    return null
  })

  async function addAdmin(name: string, permission: AdminPermission): Promise<string | null> {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return 'Enter a valid username'

    const existing = _adminUsers.value.find(u => u.name.toLowerCase() === normalized)
    if (existing) return `"${name}" is already an admin (${existing.permission})`

    try {
      await supabaseInsert(TABLES.ADMIN_USERS, {
        name: normalized,
        permission,
        added_by: _currentUserName.value || 'unknown',
      })
      await fetchAdminUsers()
      return null
    } catch (e: any) {
      console.warn('[adminPermissions] addAdmin failed', e)
      if (e.message?.includes('23505') || e.message?.includes('duplicate')) {
        return `"${name}" is already an admin`
      }
      return 'Failed to add admin'
    }
  }

  async function removeAdmin(name: string): Promise<string | null> {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return 'Enter a valid username'

    if (normalized === _currentUserName.value) {
      const user = getUser(normalized)
      if (user?.permission === 'owner') return 'Cannot remove yourself as owner'
    }

    try {
      await supabaseDelete(TABLES.ADMIN_USERS, { name: normalized })
      await fetchAdminUsers()
      return null
    } catch (e) {
      console.warn('[adminPermissions] removeAdmin failed', e)
      return 'Failed to remove admin'
    }
  }

  async function updatePermission(name: string, permission: AdminPermission): Promise<string | null> {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return 'Enter a valid username'

    if (normalized === _currentUserName.value) {
      const user = getUser(normalized)
      if (user?.permission === 'owner' && permission !== 'owner') {
        return 'Cannot demote yourself from owner'
      }
    }

    try {
      await supabaseUpdate(TABLES.ADMIN_USERS, { name: normalized }, { permission })
      await fetchAdminUsers()
      return null
    } catch (e) {
      console.warn('[adminPermissions] updatePermission failed', e)
      return 'Failed to update permission'
    }
  }

  async function seedOwnerIfNeeded(): Promise<boolean> {
    if (_adminUsers.value.length > 0) return false
    if (!_currentUserName.value) return false

    try {
      const existing = await supabaseSelect<any[]>(TABLES.ADMIN_USERS, { limit: 1 })
      if (existing && existing.length > 0) {
        return false
      }

      await supabaseInsert(TABLES.ADMIN_USERS, {
        name: _currentUserName.value,
        permission: 'owner',
        added_by: 'system',
      })
      await fetchAdminUsers()
      return true
    } catch (e) {
      console.warn('[adminPermissions] seedOwnerIfNeeded failed', e)
      return false
    }
  }

  async function refresh() {
    await fetchAdminUsers()
    await seedOwnerIfNeeded()
  }

  setTimeout(() => seedOwnerIfNeeded(), 2000)

  return {
    adminUsers: _adminUsers,
    isAdmin,
    canEdit,
    isOwner,
    currentPermission,
    setCurrentUser,
    getUser,
    addAdmin,
    removeAdmin,
    updatePermission,
    refresh,
  }
}
