<template>
  <div class="me-profile-panel flex flex-col h-full overflow-hidden">
    <!-- Hero Profile Banner -->
    <div class="profile-banner relative flex-shrink-0 overflow-hidden">
      <div class="banner-bg" />
      <div class="banner-blob banner-blob-1" />
      <div class="banner-blob banner-blob-2" />
      <div class="banner-content relative z-1 px-4 pt-6 pb-5">
        <div class="flex items-center gap-4 mb-3">
          <div class="avatar-ring">
            <PlayerAvatar
              class="overflow-hidden rounded-xl"
              :src="gameProfile?.textures?.SKIN?.url"
              :dimension="56"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-white truncate">{{ gameProfile?.name || t('login.login') }}</h2>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="authority-badge inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="authorityBadgeClass">
                <v-icon size="10">{{ authorityIcon }}</v-icon>
                {{ authorityLabel }}
              </span>
              <span v-if="currentUserExpired" class="text-[10px] font-semibold text-red-400 flex items-center gap-1">
                <v-icon size="10" color="error">warning</v-icon>
                {{ t('user.tokenExpired') }}
              </span>
            </div>
          </div>
          <UserAccountSwitcher class="account-switcher-inline" show-inline-delete density="comfortable" />
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row flex gap-2 px-4 py-3 flex-shrink-0">
      <div class="stat-pill flex-1 flex flex-col items-center rounded-xl py-2.5 px-2">
        <span class="stat-value text-white font-bold text-lg">{{ displayInstances }}</span>
        <span class="stat-label text-[10px] font-medium uppercase tracking-wider opacity-50">{{ t('dashboard.totalInstances') }}</span>
      </div>
      <div class="stat-pill flex-1 flex flex-col items-center rounded-xl py-2.5 px-2">
        <span class="stat-value text-white font-bold text-lg">{{ displayPlaytime }}</span>
        <span class="stat-label text-[10px] font-medium uppercase tracking-wider opacity-50">{{ t('dashboard.totalPlaytime') }}</span>
      </div>
      <div class="stat-pill flex-1 flex flex-col items-center rounded-xl py-2.5 px-2">
        <span class="stat-value text-white font-bold text-lg">{{ displayRecent }}</span>
        <span class="stat-label text-[10px] font-medium uppercase tracking-wider opacity-50">{{ t('dashboard.recentPlayed') }}</span>
      </div>
    </div>

    <!-- Skin & Cape Card -->
    <div class="skin-cape-card mx-3 mb-2 flex-shrink-0 rounded-2xl overflow-hidden">
      <div class="skin-card-header flex items-center justify-between px-4 py-2.5">
        <span class="text-xs font-semibold uppercase tracking-widest opacity-60">{{ t('userSkin.title') }}</span>
        <div class="flex items-center gap-1">
          <v-btn icon variant="text" size="x-small" class="opacity-40 hover:opacity-100" @click="skinModel.reset()">
            <v-icon size="14">restart_alt</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="flex items-center justify-center py-2 cursor-default skin-model-area">
        <UserSkin
          :user="userProfile"
          :profile="gameProfile"
          :inspect="false"
        />
      </div>

      <div v-if="capes.length > 0" class="cape-section px-4 py-3">
        <div class="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-2 flex items-center gap-1.5">
          <v-icon size="12">auto_awesome</v-icon>
          {{ t('userCape.changeTitle') }}
        </div>
        <div
          ref="capeScroller"
          v-roving-tabindex
          role="radiogroup"
          :aria-label="t('userCape.changeTitle')"
          class="cape-scroll flex gap-2 overflow-x-auto pb-1"
          @wheel.prevent="onCapeWheel"
        >
          <div
            v-shared-tooltip.top="() => t('userCape.noCape')"
            class="cape-thumb flex-shrink-0 cursor-pointer rounded-xl border-2 transition-all flex items-center justify-center"
            :class="!skinModel.cape.value
              ? 'cape-thumb-active'
              : 'cape-thumb-inactive'"
            role="radio"
            tabindex="0"
            :aria-checked="!skinModel.cape.value"
            :aria-label="t('userCape.noCape')"
            @click="selectCape(undefined)"
            @keydown.enter.prevent="selectCape(undefined)"
            @keydown.space.prevent="selectCape(undefined)"
          >
            <div class="w-full h-full rounded-lg border-2 border-dashed border-current opacity-25 flex items-center justify-center">
              <v-icon size="14" aria-hidden="true">block</v-icon>
            </div>
          </div>
          <div
            v-for="c of capes"
            :key="c.id"
            v-shared-tooltip.top="() => c.alias || c.id"
            class="cape-thumb flex-shrink-0 cursor-pointer rounded-xl border-2 transition-all overflow-hidden"
            :class="skinModel.cape.value === c.url
              ? 'cape-thumb-active'
              : 'cape-thumb-inactive'"
            role="radio"
            tabindex="0"
            :aria-checked="skinModel.cape.value === c.url"
            :aria-label="c.alias || c.id"
            @click="selectCape(c.url)"
            @keydown.enter.prevent="selectCape(c.url)"
            @keydown.space.prevent="selectCape(c.url)"
          >
            <div class="cape-scale-wrapper">
              <PlayerCape :src="c.url" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1" />
  </div>
</template>

<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import PlayerCape from '@/components/PlayerCape.vue'
import UserAccountSwitcher from '@/components/UserAccountSwitcher.vue'
import UserSkin from '@/components/UserSkin.vue'
import { kUserContext } from '@/composables/user'
import { kInstances } from '@/composables/instances'
import { injection } from '@/util/inject'
import { UserSkinModel, UserSkinRenderPaused, useUserSkin } from '@/composables/userSkin'
import { AUTHORITY_DEV, AUTHORITY_MICROSOFT, AUTHORITY_MOJANG } from '@xmcl/runtime-api'
import { vRovingTabindex } from '@/directives/rovingTabindex'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { computed, inject, ref, provide, onMounted } from 'vue'

const { t } = useI18n()

const { userProfile, gameProfile } = injection(kUserContext)
const { instances } = injection(kInstances)

const paused = inject(UserSkinRenderPaused, ref(false))

const skinModel = useUserSkin(
  computed(() => userProfile.value.id),
  gameProfile,
  computed(() => userProfile.value),
)
provide(UserSkinModel, skinModel)
const capes = computed(() => gameProfile.value?.capes ?? [])
const capeScroller = ref<HTMLElement | null>(null)

function selectCape(url: string | undefined) {
  skinModel.cape.value = url
  skinModel.save()
}

function onCapeWheel(e: WheelEvent) {
  if (capeScroller.value) {
    capeScroller.value.scrollLeft += e.deltaY
  }
}

const authorityIcon = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'microsoft'
    case AUTHORITY_MOJANG: return 'person'
    case AUTHORITY_DEV: return 'offline_bolt'
    default: return 'person'
  }
})

const authorityBadgeClass = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'badge-microsoft'
    case AUTHORITY_MOJANG: return 'badge-mojang'
    case AUTHORITY_DEV: return 'badge-offline'
    default: return 'badge-default'
  }
})

const authorityLabel = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'Microsoft'
    case AUTHORITY_MOJANG: return 'Mojang'
    case AUTHORITY_DEV: return t('userServices.offline.name')
    default: return userProfile.value.authority
  }
})

const currentUserExpired = computed(() => {
  return userProfile.value.invalidated || userProfile.value.expiredAt < Date.now()
})

// Stats
const displayInstances = computed(() => instances.value.length)

const displayPlaytime = computed(() => {
  const total = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const totalSec = Math.floor(total / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return hours + 'h'
  return minutes + 'm'
})

const displayRecent = computed(() => {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000
  return instances.value.filter(i => (i.lastAccessDate || 0) > week).length
})

const animInstances = ref(0)
const animPlaytime = ref('0h')
const animRecent = ref(0)

onMounted(() => {
  const targetInst = displayInstances.value
  const targetRecent = displayRecent.value
  const targetPlay = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const duration = 600
  const step = 16
  const steps = duration / step
  let frame = 0
  const timer = setInterval(() => {
    frame++
    const progress = Math.min(frame / steps, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    animInstances.value = Math.round(targetInst * ease)
    animRecent.value = Math.round(targetRecent * ease)
    const totalSec = Math.floor((targetPlay * ease) / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    animPlaytime.value = hours > 0 ? hours + 'h' : minutes + 'm'
    if (progress >= 1) clearInterval(timer)
  }, step)
})
</script>

<style scoped>
.me-profile-panel {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(12px);
}

/* Profile Banner */
.profile-banner {
  position: relative;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 40%, #1a1a3e 100%);
}

.banner-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  pointer-events: none;
}

.banner-blob-1 {
  width: 200px;
  height: 200px;
  background: #7c3aed;
  top: -60px;
  right: -40px;
}

.banner-blob-2 {
  width: 150px;
  height: 150px;
  background: #3b82f6;
  bottom: -40px;
  left: -30px;
}

.avatar-ring {
  border-radius: 14px;
  padding: 3px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.6), rgba(59, 130, 246, 0.6));
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
}

.authority-badge {
  backdrop-filter: blur(8px);
}

.badge-microsoft {
  background: rgba(16, 124, 16, 0.25);
  color: #4ade80;
}

.badge-mojang {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.badge-offline {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.badge-default {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

/* Stats Row */
.stats-row {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.stat-pill {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.stat-value {
  font-variant-numeric: tabular-nums;
}

/* Skin Card */
.skin-cape-card {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.skin-card-header {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.skin-model-area {
  min-height: 140px;
}

/* Cape Section */
.cape-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.cape-thumb {
  width: 40px;
  height: 56px;
  padding: 4px;
  transition: all 0.2s ease;
}

.cape-thumb:hover {
  transform: translateY(-2px) scale(1.08);
}

.cape-thumb-active {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.12);
  box-shadow: 0 0 16px rgba(var(--v-theme-primary), 0.15);
}

.cape-thumb-inactive {
  border-color: transparent;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.cape-thumb-inactive:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.cape-scale-wrapper {
  width: 80px;
  height: 120px;
  transform: scale(0.4);
  transform-origin: top left;
}

.cape-scroll {
  scrollbar-width: none;
}

.cape-scroll::-webkit-scrollbar {
  display: none;
}

.account-switcher-inline {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.account-switcher-inline :deep(.user-account-switcher__identity) {
  background: rgba(0,0,0,0.2);
  border-color: rgba(255,255,255,0.1);
  padding: 4px 8px;
  border-radius: 10px;
  min-height: unset;
  gap: 6px;
}

.account-switcher-inline :deep(.user-account-switcher__identity span) {
  display: none;
}

.account-switcher-inline :deep(.user-account-switcher__identity .v-icon) {
  color: rgba(255,255,255,0.7);
  font-size: 16px;
}
</style>
