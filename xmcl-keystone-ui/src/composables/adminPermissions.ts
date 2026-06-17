import { computed, ref, onUnmounted } from 'vue'
import { fbGet, fbSet, fbRemove } from './firebase'

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
    const val = await fbGet<Record<string, AdminUser>>('adminUsers')
    if (val && typeof val === 'object') {
      const arr: AdminUser[] = []
      for (const key of Object.keys(val)) {
        const item = val[key]
        if (item && item.name) {
          arr.push({ ...item, id: key })
        }
      }
      _adminUsers.value = arr
    } else {
      _adminUsers.value = []
    }
  } catch {
    // silently fail
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
   * Fallback: if Firebase is empty, the hardcoded owner still gets access.
   * Once Firebase data loads, Firebase admins take precedence.
   */
  function hasFallbackAccess(): boolean {
    return _currentUserName.value === OWNER_FALLBACK
  }

  const isOwner = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return user.permission === 'owner'
    // Fallback: ilmarkz_ is always owner
    return hasFallbackAccess()
  })

  const canEdit = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return user.permission === 'edit' || user.permission === 'owner'
    // Fallback: ilmarkz_ can always edit
    return hasFallbackAccess()
  })

  const isAdmin = computed(() => {
    if (!_currentUserName.value) return false
    const user = getUser(_currentUserName.value)
    if (user) return true
    // Fallback: ilmarkz_ is always admin
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
      const newUser: Omit<AdminUser, 'id'> = {
        name: normalized,
        permission,
        addedAt: Date.now(),
        addedBy: _currentUserName.value || 'unknown',
      }
      // Use the name as the key for easy lookup
      await fbSet(`adminUsers/${normalized}`, newUser)
      await fetchAdminUsers()
      return null
    } catch {
      return 'Failed to add admin'
    }
  }

  async function removeAdmin(name: string): Promise<string | null> {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return 'Enter a valid username'

    // Prevent removing yourself from owner role
    if (normalized === _currentUserName.value) {
      const user = getUser(normalized)
      if (user?.permission === 'owner') return 'Cannot remove yourself as owner'
    }

    try {
      await fbRemove(`adminUsers/${normalized}`)
      await fetchAdminUsers()
      return null
    } catch {
      return 'Failed to remove admin'
    }
  }

  async function updatePermission(name: string, permission: AdminPermission): Promise<string | null> {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return 'Enter a valid username'

    // Prevent demoting yourself from owner
    if (normalized === _currentUserName.value) {
      const user = getUser(normalized)
      if (user?.permission === 'owner' && permission !== 'owner') {
        return 'Cannot demote yourself from owner'
      }
    }

    try {
      await fbSet(`adminUsers/${normalized}/permission`, permission)
      await fetchAdminUsers()
      return null
    } catch {
      return 'Failed to update permission'
    }
  }

  /** Auto-create the fallback owner in Firebase if no admin users exist yet */
  async function seedOwnerIfNeeded(): Promise<boolean> {
    if (_adminUsers.value.length > 0) return false // already has admins
    if (!_currentUserName.value) return false
    
    // Only seed if the current user is the fallback owner or if Firebase is empty
    const hasData = _adminUsers.value.length > 0
    if (hasData) return false
    
    try {
      const ownerName = _currentUserName.value
      // Check if there's ANY data in adminUsers
      const existing = await fbGet<Record<string, any>>('adminUsers')
      if (existing && Object.keys(existing).length > 0) {
        // Data exists but none matched our user - do nothing
        return false
      }
      
      // Seed: create the current user as owner
      await fbSet(`adminUsers/${ownerName}`, {
        name: ownerName,
        permission: 'owner',
        addedAt: Date.now(),
        addedBy: 'system',
      })
      await fetchAdminUsers()
      return true
    } catch {
      return false
    }
  }

  async function refresh() {
    await fetchAdminUsers()
    await seedOwnerIfNeeded()
  }

  // Auto-seed on first fetch
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
