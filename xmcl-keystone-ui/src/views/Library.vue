<template>
  <div class="library-page overflow-y-auto h-full">
    <div class="max-w-6xl mx-auto px-6 py-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="library-header-icon">
          <v-icon size="24" color="white">library_books</v-icon>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">{{ t('library.title') }}</h1>
          <p class="text-sm text-white/40">{{ t('library.subtitle') }}</p>
        </div>
      </div>

      <!-- Profiles Section -->
      <section class="mb-8">
        <div class="section-header mb-4">
          <div class="section-header-icon">
            <v-icon size="18" color="rgb(var(--v-theme-primary))">person</v-icon>
          </div>
          <h2 class="text-lg font-bold text-white">{{ t('library.profiles') }}</h2>
          <span class="section-header-badge">{{ users.length }}</span>
          <span class="section-header-line" />
        </div>

        <!-- Empty state -->
        <div v-if="users.length === 0" class="empty-state rounded-xl p-8 text-center">
          <v-icon size="48" color="white/20" class="mb-3">person_off</v-icon>
          <h3 class="text-base font-semibold text-white/70 mb-1">{{ t('library.noProfiles') }}</h3>
          <p class="text-sm text-white/40 mb-4">{{ t('library.noProfilesHint') }}</p>
          <v-btn color="primary" variant="flat" prepend-icon="person_add" to="/me" class="text-none">
            {{ t('library.addProfile') }}
          </v-btn>
        </div>

        <!-- Profile cards -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="user in users"
            :key="user.id"
            class="profile-card"
            :class="{ 'profile-card--active': user.id === userProfile?.id }"
            @click="selectUser(user.id)"
          >
            <div class="profile-card-inner">
              <div class="profile-card-avatar">
                <PlayerAvatar
                  v-if="getProfileTexture(user)?.SKIN?.url"
                  :src="getProfileTexture(user)?.SKIN?.url || ''"
                  :dimension="48"
                  class="rounded-xl"
                />
                <div v-else class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <v-icon size="24" color="white/50">person</v-icon>
                </div>
              </div>
              <div class="profile-card-info">
                <div class="profile-card-name">{{ getProfileName(user) || user.username || t('library.unknown') }}</div>
                <div class="profile-card-meta">
                  <span class="authority-badge" :class="`authority-badge--${user.authority}`">
                    {{ formatAuthority(user.authority) }}
                  </span>
                  <span v-if="user.id === userProfile?.id" class="active-badge">
                    {{ t('library.active') }}
                  </span>
                </div>
                <div class="profile-card-uuid" v-if="getSelectedProfile(user)?.id">
                  {{ getSelectedProfile(user)?.id?.slice(0, 8) }}...
                </div>
              </div>
              <div class="profile-card-check" v-if="user.id === userProfile?.id">
                <v-icon color="primary" size="20">check_circle</v-icon>
              </div>
            </div>
            <!-- Profiles within account -->
            <div v-if="Object.keys(user.profiles).length > 1" class="profile-card-sub-profiles">
              <div
                v-for="(profile, pid) in user.profiles"
                :key="pid"
                class="sub-profile-row"
                :class="{ 'sub-profile-row--active': pid === user.selectedProfile }"
              >
                <span class="sub-profile-name">{{ profile.name || pid }}</span>
                <v-icon v-if="pid === user.selectedProfile" size="12" color="primary">check</v-icon>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Instances Section -->
      <section>
        <div class="section-header mb-4">
          <div class="section-header-icon">
            <v-icon size="18" color="rgb(var(--v-theme-primary))">inventory_2</v-icon>
          </div>
          <h2 class="text-lg font-bold text-white">{{ t('library.instances') }}</h2>
          <span class="section-header-badge">{{ instances.length }}</span>
          <span class="section-header-line" />
          <div class="flex-1" />
          <v-text-field
            v-model="instanceSearch"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
            :placeholder="t('library.searchInstances')"
            prepend-inner-icon="search"
            class="instance-search-field"
            style="max-width: 240px;"
            clearable
          />
        </div>

        <!-- Empty state -->
        <div v-if="filteredInstances.length === 0" class="empty-state rounded-xl p-8 text-center">
          <v-icon size="48" color="white/20" class="mb-3">inventory_2</v-icon>
          <h3 class="text-base font-semibold text-white/70 mb-1">
            {{ instanceSearch ? t('library.noSearchResults') : t('library.noInstances') }}
          </h3>
          <p class="text-sm text-white/40 mb-4">
            {{ instanceSearch ? t('library.noSearchResultsHint') : t('library.noInstancesHint') }}
          </p>
          <v-btn
            v-if="!instanceSearch"
            color="primary"
            variant="flat"
            prepend-icon="add"
            class="text-none"
            @click="showAddInstance()"
          >
            {{ t('instances.add') }}
          </v-btn>
        </div>

        <!-- Instance grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="inst in filteredInstances"
            :key="inst.path"
            v-context-menu="getInstanceContextMenu(inst)"
            class="instance-card-item"
            :class="{ 'instance-card-item--selected': inst.path === selectedInstance }"
            @click="openInstance(inst)"
          >
            <div class="instance-card-item-main">
              <div class="instance-card-item-icon">
                <v-img
                  :src="getInstanceIcon(inst, undefined)"
                  :width="48"
                  :height="48"
                  class="rounded-xl"
                />
              </div>
              <div class="instance-card-item-info">
                <div class="instance-card-item-name">{{ inst.name || t('library.unknown') }}</div>
                <div class="instance-card-item-runtime">{{ formatRuntime(inst.runtime) }}</div>
                <div class="instance-card-item-meta">
                  <span>{{ formatDate(inst.lastAccessDate) }}</span>
                  <span v-if="inst.playtime" class="meta-sep">·</span>
                  <span v-if="inst.playtime">{{ formatPlaytime(inst.playtime) }}</span>
                </div>
              </div>
              <div class="instance-card-item-status">
                <template v-if="getInstanceStatus(inst) === 'launching'">
                  <v-progress-circular indeterminate size="18" width="2" color="primary" />
                </template>
                <template v-else-if="getInstanceStatus(inst) === 'running'">
                  <span class="status-dot status-dot--green" />
                </template>
              </div>
            </div>
            <!-- Instance actions row -->
            <div class="instance-card-item-actions">
              <v-btn
                icon
                variant="text"
                size="x-small"
                class="instance-action-btn"
                @click.stop="openInstanceSettings(inst)"
              >
                <v-icon size="14">settings</v-icon>
              </v-btn>
              <v-btn
                v-if="getInstanceStatus(inst) === 'idle'"
                icon
                variant="flat"
                size="x-small"
                color="primary"
                class="instance-action-btn instance-action-btn--play"
                @click.stop="launchInstance(inst)"
              >
                <v-icon size="16">play_arrow</v-icon>
              </v-btn>
              <v-btn
                v-else-if="getInstanceStatus(inst) === 'running'"
                icon
                variant="flat"
                size="x-small"
                color="red"
                class="instance-action-btn instance-action-btn--stop"
                @click.stop="stopInstance(inst)"
              >
                <v-icon size="14">stop</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="x-small"
                class="instance-action-btn"
                @click.stop="openInstanceFolder(inst)"
              >
                <v-icon size="14">folder_open</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { useDialog } from '@/composables/dialog'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'
import { kInstanceLaunch } from '@/composables/instanceLaunch'
import { kInstances } from '@/composables/instances'
import { kUserContext } from '@/composables/user'
import { getInstanceIcon } from '@/util/favicon'
import { injection } from '@/util/inject'
import { vContextMenu } from '@/directives/contextMenu'
import { useInstanceContextMenuFunc } from '@/composables/instanceContextMenu'
import { useRouter } from 'vue-router'
import { computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Instance } from '@xmcl/instance'
import type { GameProfileAndTexture, UserProfile } from '@xmcl/runtime-api'

const { t } = useI18n()
const router = useRouter()
const { show: showAddInstance } = useDialog(AddInstanceDialogKey)

const { instances, selectedInstance } = injection(kInstances)
const { users, userProfile, select: selectUser } = injection(kUserContext)
const instanceLaunch = injection(kInstanceLaunch)

const getInstanceContextMenu = useInstanceContextMenuFunc()

const instanceSearch = ref('')

const filteredInstances = computed(() => {
  const query = instanceSearch.value.toLowerCase().trim()
  const sorted = [...instances.value].sort((a, b) => (b.lastAccessDate || 0) - (a.lastAccessDate || 0))
  if (!query) return sorted
  return sorted.filter(i =>
    i.name.toLowerCase().includes(query) ||
    i.path.toLowerCase().includes(query) ||
    i.runtime.minecraft?.includes(query) ||
    Object.values(i.runtime).some(v => typeof v === 'string' && v.toLowerCase().includes(query))
  )
})

function getProfileTexture(user: UserProfile): GameProfileAndTexture['textures'] | undefined {
  const profile = user.profiles[user.selectedProfile]
  return (profile as GameProfileAndTexture)?.textures
}

function getProfileName(user: UserProfile): string {
  const profile = user.profiles[user.selectedProfile]
  return (profile as GameProfileAndTexture)?.name || user.username || ''
}

function getSelectedProfile(user: UserProfile): GameProfileAndTexture | undefined {
  return user.profiles[user.selectedProfile] as GameProfileAndTexture | undefined
}

function formatAuthority(authority: string): string {
  if (authority === 'microsoft') return 'Microsoft'
  if (authority === 'mojang') return 'Mojang'
  if (authority === 'dev') return 'Offline'
  return authority
}

function getInstanceStatus(inst: Instance): 'idle' | 'launching' | 'running' {
  if (instanceLaunch.launching.value && selectedInstance.value === inst.path) {
    return 'launching'
  }
  const running = instanceLaunch.gameProcesses.value?.find(p => p.options.gameDirectory === inst.path)
  if (running) return 'running'
  return 'idle'
}

function openInstance(inst: Instance) {
  selectedInstance.value = inst.path
  router.push('/base-setting')
}

function openInstanceSettings(inst: Instance) {
  selectedInstance.value = inst.path
  router.push('/base-setting')
}

function launchInstance(inst: Instance) {
  selectedInstance.value = inst.path
  nextTick(() => {
    instanceLaunch.launch()
  })
}

function stopInstance(inst: Instance) {
  selectedInstance.value = inst.path
  instanceLaunch.kill()
}

function openInstanceFolder(inst: Instance) {
  selectedInstance.value = inst.path
  // The app will handle folder opening through IPC
  router.push('/base-setting')
}

function formatRuntime(runtime: Instance['runtime']) {
  const parts: string[] = []
  if (runtime?.minecraft) parts.push(runtime.minecraft)
  if (runtime?.forge) parts.push(`Forge ${runtime.forge}`)
  if (runtime?.fabricLoader) parts.push(`Fabric ${runtime.fabricLoader}`)
  if (runtime?.quiltLoader) parts.push(`Quilt ${runtime.quiltLoader}`)
  if (runtime?.neoForged) parts.push(`NeoForge ${runtime.neoForged}`)
  return parts.join(' + ') || t('library.unknownVersion')
}

function formatPlaytime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return '<1m'
}

function formatDate(ts: number) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return t('dashboard.today')
  if (days === 1) return t('dashboard.yesterday')
  if (days < 7) return t('dashboard.daysAgo', { days })
  return date.toLocaleDateString()
}
</script>

<style scoped>
.library-page {
  height: 100%;
}

.library-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.2), rgba(var(--v-theme-primary), 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-header-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

.section-header-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.instance-search-field {
  font-size: 13px !important;
}

/* Empty state */
.empty-state {
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.08);
}

/* Profile Cards */
.profile-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
}

.profile-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.profile-card--active {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.06);
}

.profile-card-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-card-avatar {
  flex-shrink: 0;
}

.profile-card-info {
  flex: 1;
  min-width: 0;
}

.profile-card-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.authority-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.authority-badge--microsoft {
  background: rgba(76, 175, 80, 0.15);
  color: #4ade80;
}

.authority-badge--mojang {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
}

.authority-badge--dev {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
}

.active-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
}

.profile-card-uuid {
  font-size: 10px;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 2px;
}

.profile-card-check {
  flex-shrink: 0;
}

.profile-card-sub-profiles {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  transition: background 0.15s ease;
}

.sub-profile-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.sub-profile-row--active {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(var(--v-theme-primary), 0.06);
}

.sub-profile-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Instance Cards */
.instance-card-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
}

.instance-card-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.instance-card-item--selected {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.05);
}

.instance-card-item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.instance-card-item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.instance-card-item-info {
  flex: 1;
  min-width: 0;
}

.instance-card-item-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.instance-card-item-runtime {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.instance-card-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 4px;
}

.meta-sep {
  color: rgba(255, 255, 255, 0.1);
}

.instance-card-item-status {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--green {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.instance-card-item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.instance-action-btn {
  border-radius: 8px !important;
  width: 30px !important;
  height: 30px !important;
  color: rgba(255, 255, 255, 0.3) !important;
  transition: all 0.2s ease !important;
}

.instance-action-btn:hover {
  color: rgba(255, 255, 255, 0.7) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.instance-action-btn--play {
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2) !important;
}

.instance-action-btn--play:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.35) !important;
}

.instance-action-btn--stop {
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2) !important;
}

.instance-action-btn--stop:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35) !important;
}

/* Scrollbar */
.library-page::-webkit-scrollbar {
  width: 6px;
}

.library-page::-webkit-scrollbar-track {
  background: transparent;
}

.library-page::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.library-page::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Responsive */
@media (max-width: 640px) {
  .library-page {
    padding: 12px !important;
  }

  .instance-search-field {
    max-width: 100% !important;
  }
}
</style>
