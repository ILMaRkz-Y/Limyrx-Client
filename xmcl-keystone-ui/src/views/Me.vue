<template>
  <div class="profile-page overflow-y-auto h-full">
    <div class="max-w-6xl mx-auto px-6 py-6">

      <!-- Hero Profile Banner -->
      <div class="profile-hero rounded-2xl mb-6 relative overflow-hidden" :style="{ backgroundImage: customBanner ? `url(${customBanner})` : undefined }">
        <div v-if="customBanner" class="hero-banner-img" :style="{ backgroundImage: `url(${customBanner})` }" />
        <!-- Glow orbs (hidden when custom banner) -->
        <template v-if="!customBanner">
          <div class="hero-glow hero-glow-1" />
          <div class="hero-glow hero-glow-2" />
          <div class="hero-glow hero-glow-3" />
          <div class="hero-grain" />
        </template>
        <div class="hero-border-glow" />
        <!-- Upload banner button -->
        <button class="hero-upload-banner" @click="triggerBannerUpload" title="Upload custom banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <input ref="bannerInputRef" type="file" accept="image/*" class="hidden" @change="onBannerSelected" />
        <div class="relative z-10">
          <div class="flex items-center gap-6">
            <!-- Avatar -->
            <div class="hero-avatar-wrap">
              <PlayerAvatar
                v-if="heroAvatarUrl"
                :src="heroAvatarUrl"
                :dimension="72"
                class="rounded-2xl"
              />
              <div v-else class="w-[72px] h-[72px] rounded-2xl bg-white/10 flex items-center justify-center">
                <v-icon size="32" color="white/50">person</v-icon>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 relative">
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-bold text-white truncate">{{ displayName }}</h1>
                <span v-if="!isLoggedIn" class="text-xs text-red-400 font-medium px-2 py-0.5 rounded-full bg-red-500/15">Offline</span>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <span v-if="isLoggedIn" class="authority-chip" :class="authorityClass">
                  <template v-if="userProfile?.authority === 'microsoft'">
                    <svg class="w-3 h-3" viewBox="0 0 21 21" fill="currentColor">
                      <rect x="1" y="1" width="9" height="9" rx="1.5"/>
                      <rect x="11" y="1" width="9" height="9" rx="1.5"/>
                      <rect x="1" y="11" width="9" height="9" rx="1.5"/>
                      <rect x="11" y="11" width="9" height="9" rx="1.5"/>
                    </svg>
                  </template>
                  <v-icon v-else size="12">{{ authorityIcon }}</v-icon>
                  {{ authorityLabel }}
                </span>
<span v-if="isLoggedIn && currentUserExpired" class="text-xs text-red-400 flex items-center gap-1">
                  <v-icon size="12" color="error">warning</v-icon>
                  Token expired — re-login needed
                </span>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <v-btn v-if="isLoggedIn" variant="outlined" color="white" size="small" to="/skins" class="text-none">
                <v-icon start size="14">palette</v-icon> Skins
              </v-btn>
              <v-btn v-if="isLoggedIn" variant="outlined" color="white" size="small" to="/setting" class="text-none">
                <v-icon start size="14">settings</v-icon> Settings
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Left Column: Account / Login -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-4">
            <template v-if="userProfile?.authority === 'microsoft'">
              <svg class="w-[18px] h-[18px]" viewBox="0 0 21 21" fill="#6366f1">
                <rect x="1" y="1" width="9" height="9" rx="1.5"/>
                <rect x="11" y="1" width="9" height="9" rx="1.5"/>
                <rect x="1" y="11" width="9" height="9" rx="1.5"/>
                <rect x="11" y="11" width="9" height="9" rx="1.5"/>
              </svg>
            </template>
            <v-icon v-else size="16" color="#6366f1">manage_accounts</v-icon>
            <h2 class="text-base font-bold text-white">Account</h2>
          </div>

          <!-- Logged in state -->
          <div v-if="isLoggedIn" class="space-y-3">
            <div class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(99,102,241,0.15);">
                <v-icon size="20" color="#6366f1">manage_accounts</v-icon>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-white block truncate">{{ gameProfile?.name }}</span>
                <span class="text-[11px] text-white/40">
                  <template v-if="userProfile?.authority === 'microsoft'">
                    <svg class="inline-block w-3.5 h-3.5 align-text-bottom mr-0.5" viewBox="0 0 21 21" fill="currentColor">
                      <rect x="1" y="1" width="9" height="9" rx="1.5"/>
                      <rect x="11" y="1" width="9" height="9" rx="1.5"/>
                      <rect x="1" y="11" width="9" height="9" rx="1.5"/>
                      <rect x="11" y="11" width="9" height="9" rx="1.5"/>
                    </svg>
                    Microsoft account
                  </template>
                  <template v-else-if="userProfile?.authority === 'dev'">Offline</template>
                  <template v-else>Mojang account</template>
                </span>
              </div>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="x-small" color="white" v-bind="props">
                    <v-icon size="16">more_vert</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" class="pa-1">
                  <v-list-item @click="switchAccount" class="text-sm">
                    <template #prepend><v-icon size="14">swap_horiz</v-icon></template>
                    Switch Account
                  </v-list-item>
                  <v-list-item @click="logout" class="text-sm text-red-400">
                    <template #prepend><v-icon size="14" color="red">logout</v-icon></template>
                    Sign Out
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- Session info -->
            <div class="bg-white/5 rounded-xl px-4 py-3 text-xs text-white/40 space-y-1">
              <div class="flex justify-between">
                <span>Account type</span>
                <span class="text-white/60 font-medium">{{ authorityLabel }}</span>
              </div>
              <div class="flex justify-between">
                <span>UUID</span>
                <span class="text-white/60 font-mono text-[10px]">{{ gameProfile?.id || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cape</span>
                <span class="text-white/60">{{ hasCape ? 'Yes' : 'None' }}</span>
              </div>
            </div>
          </div>

          <!-- Not logged in — show sign-in options -->
          <div v-else class="space-y-3">
            <p class="text-xs text-white/40 mb-3">Sign in to access your Minecraft account, skins, and capes.</p>

            <!-- Microsoft Sign In -->
            <button class="login-option-btn login-microsoft" @click="loginMicrosoft">
              <div class="login-option-icon" style="background: rgba(16,124,16,0.2);">
                <v-icon size="18" color="#4ade80">microsoft</v-icon>
              </div>
              <div class="flex-1 text-left">
                <span class="text-sm font-medium text-white">Microsoft Account</span>
                <span class="text-[10px] text-white/40">Official Minecraft authentication</span>
              </div>
              <v-icon size="16" color="white/30">arrow_forward_ios</v-icon>
            </button>

            <!-- Mojang Sign In (Legacy) -->
            <button class="login-option-btn login-mojang" @click="loginMojang">
              <div class="login-option-icon" style="background: rgba(234,179,8,0.2);">
                <v-icon size="18" color="#facc15">person</v-icon>
              </div>
              <div class="flex-1 text-left">
                <span class="text-sm font-medium text-white">Mojang Account</span>
                <span class="text-[10px] text-white/40">Legacy email/password login</span>
              </div>
              <v-icon size="16" color="white/30">arrow_forward_ios</v-icon>
            </button>

            <!-- Offline / Cracked -->
            <button class="login-option-btn login-offline" @click="showOfflineDialog = true">
              <div class="login-option-icon" style="background: rgba(255,255,255,0.08);">
                <v-icon size="18" color="white/60">offline_bolt</v-icon>
              </div>
              <div class="flex-1 text-left">
                <span class="text-sm font-medium text-white">Offline (Cracked)</span>
                <span class="text-[10px] text-white/40">Play without authentication</span>
              </div>
              <v-icon size="16" color="white/30">arrow_forward_ios</v-icon>
            </button>
          </div>
        </div>

        <!-- Middle Column: Skin Preview -->
        <div class="profile-card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <v-icon size="16" color="#22c55e">palette</v-icon>
              <h2 class="text-base font-bold text-white">Skin Preview</h2>
            </div>
            <v-btn v-if="isLoggedIn" variant="text" size="x-small" color="white" to="/skins" class="text-white/40 hover:text-white">
              <span class="text-xs">Manage</span>
              <v-icon end size="12">arrow_forward</v-icon>
            </v-btn>
          </div>
          <div class="flex items-center justify-center py-4">
            <div v-if="displayName !== 'Not signed in'" class="skin-render-wrapper">
              <img
                :src="`https://render.crafty.gg/3d/bust/${encodeURIComponent(displayName)}`"
                alt="Skin preview"
                class="skin-render-img"
                @error="skinRenderFailed = true"
              />
            </div>
            <div v-else class="flex flex-col items-center text-white/20 py-8">
              <v-icon size="48" class="mb-2">person_off</v-icon>
              <span class="text-xs">Sign in to see your skin</span>
            </div>
          </div>
          <div v-if="hasCape" class="flex items-center justify-center gap-2 mt-2">
            <span class="text-[10px] text-white/30 flex items-center gap-1">
              <v-icon size="10" color="#22c55e">check_circle</v-icon>
              Cape available
            </span>
          </div>
        </div>

        <!-- Right Column: Stats -->
        <div class="profile-card">
          <div class="flex items-center gap-2 mb-4">
            <v-icon size="16" color="#facc15">bar_chart</v-icon>
            <h2 class="text-base font-bold text-white">Statistics</h2>
          </div>
          <div class="space-y-2">
            <div class="stat-row-item">
              <div class="stat-row-icon" style="background: rgba(99,102,241,0.15);">
                <v-icon size="14" color="#6366f1">inventory_2</v-icon>
              </div>
              <span class="stat-row-label">Instances</span>
              <span class="stat-row-value">{{ instances.length }}</span>
            </div>
            <div class="stat-row-item">
              <div class="stat-row-icon" style="background: rgba(250,204,21,0.15);">
                <v-icon size="14" color="#facc15">schedule</v-icon>
              </div>
              <span class="stat-row-label">Total Playtime</span>
              <span class="stat-row-value">{{ totalPlaytime }}</span>
            </div>
            <div class="stat-row-item">
              <div class="stat-row-icon" style="background: rgba(56,189,248,0.15);">
                <v-icon size="14" color="#38bdf8">update</v-icon>
              </div>
              <span class="stat-row-label">Played This Week</span>
              <span class="stat-row-value">{{ recentCount }}</span>
            </div>
            <div class="stat-row-item">
              <div class="stat-row-icon" style="background: rgba(34,197,94,0.15);">
                <v-icon size="14" color="#22c55e">people</v-icon>
              </div>
              <span class="stat-row-label">Online Players</span>
              <span class="stat-row-value">{{ onlineCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Offline Login Dialog -->
      <v-dialog v-model="showOfflineDialog" max-width="420" persistent>
        <v-card class="rounded-2xl pa-6" style="background: rgba(28,28,40,0.98); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img
                v-if="offlineUsername.trim()"
                :src="`https://render.crafty.gg/3d/bust/${encodeURIComponent(offlineUsername.trim())}`"
                alt="skin"
                class="w-full h-full object-contain image-render-pixel"
                @error="offlineHeadError = true"
              />
              <v-icon v-else size="24" color="white/30">person</v-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Offline Mode</h3>
              <p class="text-sm text-white/50">Play without authentication</p>
            </div>
          </div>
          <v-text-field
            v-model="offlineUsername"
            label="Choose a username"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
            @update:model-value="offlineHeadError = false"
            @keydown.enter="loginOffline"
          />
          <div class="flex gap-2 justify-end">
            <v-btn variant="text" color="white" @click="showOfflineDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" :disabled="!offlineUsername.trim()" @click="loginOffline">Play Offline</v-btn>
          </div>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { kUserContext } from '@/composables/user'
import { kInstances } from '@/composables/instances'
import { useOnlinePlayers } from '@/composables/onlinePlayers'
import { useUserMenuControl } from '@/composables/userMenu'
import { injection } from '@/util/inject'
import { computed, ref } from 'vue'
import {
  AUTHORITY_DEV,
  AUTHORITY_MICROSOFT,
  AUTHORITY_MOJANG,
} from '@xmcl/runtime-api'
import { useRouter } from 'vue-router'


const { t } = useI18n()
const router = useRouter()

const { gameProfile, userProfile } = injection(kUserContext)
const { instances } = injection(kInstances)
const { show: showUserMenu } = useUserMenuControl()
const { playerCount: onlineCount } = useOnlinePlayers()

const bannerInputRef = ref<HTMLInputElement | null>(null)
const customBanner = ref(localStorage.getItem('profile-banner') || '')

function triggerBannerUpload() {
  bannerInputRef.value?.click()
}

function onBannerSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    customBanner.value = dataUrl
    localStorage.setItem('profile-banner', dataUrl)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const showOfflineDialog = ref(false)
const offlineUsername = ref('')
const offlineHeadError = ref(false)
const skinRenderFailed = ref(false)

const isLoggedIn = computed(() => !!gameProfile.value?.name)

const displayName = computed(() => {
  return gameProfile.value?.name || userProfile.value?.username || 'Not signed in'
})

const heroAvatarUrl = computed(() => {
  // Prefer real skin texture, fallback to crafty.gg render by username (works for offline/cracked too)
  if (gameProfile.value?.textures?.SKIN?.url) {
    return gameProfile.value.textures.SKIN.url
  }
  const name = gameProfile.value?.name || userProfile.value?.username
  if (name) {
    return `https://render.crafty.gg/3d/bust/${encodeURIComponent(name)}`
  }
  return ''
})

const hasCape = computed(() => {
  return gameProfile.value?.textures?.CAPE?.url != null
})

const currentUserExpired = computed(() => {
  return userProfile.value.invalidated || userProfile.value.expiredAt < Date.now()
})

const authorityIcon = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'microsoft'
    case AUTHORITY_MOJANG: return 'person'
    case AUTHORITY_DEV: return 'offline_bolt'
    default: return 'person'
  }
})

const authorityClass = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'authority-microsoft'
    case AUTHORITY_MOJANG: return 'authority-mojang'
    case AUTHORITY_DEV: return 'authority-offline'
    default: return 'authority-default'
  }
})

const authorityLabel = computed(() => {
  switch (userProfile.value.authority) {
    case AUTHORITY_MICROSOFT: return 'Microsoft'
    case AUTHORITY_MOJANG: return 'Mojang'
    case AUTHORITY_DEV: return 'Offline'
    default: return userProfile.value.authority
  }
})

const totalPlaytime = computed(() => {
  const total = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const totalSec = Math.floor(total / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

const recentCount = computed(() => {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000
  return instances.value.filter(i => (i.lastAccessDate || 0) > week).length
})

function loginMicrosoft() {
  showUserMenu('login-microsoft')
}

function loginMojang() {
  showUserMenu('login-mojang')
}

function loginOffline() {
  if (!offlineUsername.value.trim()) return
  showUserMenu('login-offline', { username: offlineUsername.value.trim() })
  showOfflineDialog.value = false
  offlineUsername.value = ''
}

function switchAccount() {
  showUserMenu('switch')
}

function logout() {
  showUserMenu('logout')
}
</script>

<style scoped>
.profile-page {
  background: transparent;
}

/* Hero Banner */
.profile-hero {
  background: linear-gradient(135deg, #0d0d24 0%, #1a0a3e 25%, #2d1b69 50%, #1a1a4e 75%, #0d0d24 100%);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 32px;
}

/* Glowing orbs */
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.hero-glow-1 {
  top: -80px;
  left: -60px;
  width: 250px;
  height: 250px;
  background: rgba(124, 58, 237, 0.3);
  animation: heroGlowFloat 6s ease-in-out infinite alternate;
}

.hero-glow-2 {
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  background: rgba(59, 130, 246, 0.25);
  animation: heroGlowFloat 8s ease-in-out infinite alternate-reverse;
}

.hero-glow-3 {
  bottom: -60px;
  right: 20%;
  width: 180px;
  height: 180px;
  background: rgba(236, 72, 153, 0.15);
  animation: heroGlowFloat 10s ease-in-out infinite alternate;
}

@keyframes heroGlowFloat {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -15px) scale(1.1); }
  100% { transform: translate(-10px, 10px) scale(0.95); }
}

/* Subtle grain texture */
.hero-grain {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
}

/* Border glow */
.hero-banner-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
  pointer-events: none;
}

.hero-upload-banner {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.hero-upload-banner:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-color: rgba(255,255,255,0.3);
}

.hero-upload-banner svg {
  width: 16px;
  height: 16px;
}

.hero-border-glow {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(124,58,237,0.3), transparent 40%, rgba(59,130,246,0.2) 70%, transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 5;
}

.hero-avatar-wrap {
  flex-shrink: 0;
}

/* Authority chip */
.authority-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}
.authority-microsoft {
  background: rgba(16,124,16,0.2);
  color: #4ade80;
}
.authority-mojang {
  background: rgba(234,179,8,0.15);
  color: #facc15;
}
.authority-offline {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}
.authority-default {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
}

/* Profile Cards */
.profile-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 18px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Login Option Buttons */
.login-option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-align: left;
}
.login-option-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.login-microsoft:hover {
  border-color: rgba(74,222,128,0.3);
  background: rgba(74,222,128,0.05);
}
.login-mojang:hover {
  border-color: rgba(250,204,21,0.3);
  background: rgba(250,204,21,0.05);
}
.login-offline:hover {
  border-color: rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
}

.login-option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Skin Render */
.skin-render-wrapper {
  width: 120px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.skin-render-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

/* Pixel-rendered skin images */
.image-render-pixel {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Stat Rows */
.stat-row-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  transition: background 0.15s ease;
}
.stat-row-item:hover {
  background: rgba(255,255,255,0.06);
}
.stat-row-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-row-label {
  flex: 1;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}
.stat-row-value {
  font-size: 16px;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
}
</style>