<template>
  <div class="dashboard px-6 py-6 overflow-y-auto h-full">
    <!-- Hero Section -->
    <div class="hero-bg-wrapper rounded-2xl p-10 mb-6 flex items-center animate-section">
      <div class="hero-bg" />
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
      <div class="blob blob-4" />
      <div class="blob blob-5" />
      <div class="blob blob-6" />
      <div class="spark sp1" />
      <div class="spark sp2" />
      <div class="spark sp3" />
      <div class="spark sp4" />
      <div class="spark sp5" />
      <div class="spark sp6" />
      <div class="spark sp7" />
      <div class="relative z-1 w-full">
        <div class="flex items-center gap-5 mb-4">
          <div class="avatar-glow-ring">
            <PlayerAvatar
              v-if="gameProfile?.textures?.SKIN?.url"
              :src="gameProfile.textures.SKIN.url"
              :dimension="56"
              class="rounded-lg"
            />
            <v-avatar v-else size="56" color="primary">
              <v-icon size="28" color="white">person</v-icon>
            </v-avatar>
          </div>
          <div class="greeting-block">
            <h1 class="text-4xl font-bold text-white">{{ greeting }}</h1>
            <p class="text-white/50 text-sm flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              {{ gameProfile?.name ? `@${gameProfile.name}` : t('dashboard.welcome') }}
            </p>

          </div>
        </div>
        <div class="hero-actions mt-4">
          <div class="split-play-wrapper">
            <v-menu
              v-model="instanceMenuOpen"
              :close-on-content-click="false"
              offset="8"
              location="bottom start"
              min-width="300"
              max-height="360"
            >
              <template #activator="{ props: menuProps }">
                <div class="play-split-btn" :class="{ 'has-instance': !!selectedPlayInstance }">
                  <span class="play-shine" />
                  <button class="play-main" :disabled="!selectedPlayInstance" @click="launchSelected">
                    <span class="play-icon-wrap">
                      <img class="play-logo" src="@/assets/logo.png" alt="" />
                    </span>
                    <span class="play-text-wrap">
                      <span class="play-label">{{ t('dashboard.play') }}</span>
                      <span class="play-instance-name" v-if="selectedPlayInstanceName">{{ selectedPlayInstanceName }}</span>
                    </span>
                  </button>
                  <button class="play-dropdown-trigger" v-bind="menuProps">
                    <v-icon size="20">expand_more</v-icon>
                  </button>
                </div>
              </template>
              <v-card variant="elevated" class="play-instance-menu">
                <v-list density="compact" class="pa-2">
                  <v-list-subheader class="text-caption font-weight-bold text-white/60">{{ t('dashboard.selectInstance') }}</v-list-subheader>
                  <v-list-item
                    v-for="inst in playableInstances"
                    :key="inst.path"
                    :active="inst.path === selectedPlayInstance"
                    class="play-instance-item rounded-lg mb-1"
                    @click="selectPlayInstance(inst)"
                  >
                    <template #prepend>
                      <v-avatar size="32" rounded class="mr-1">
                        <v-img :src="getInstanceIcon(inst, undefined)" />
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-body-2 font-weight-medium">{{ inst.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">{{ formatRuntime(inst.runtime) }}</v-list-item-subtitle>
                    <template #append>
                      <v-icon v-if="inst.path === selectedPlayInstance" color="primary" size="18">check_circle</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-menu>
          </div>
          <div class="hero-secondary-actions">
              <v-btn
              variant="flat"
              color="primary"
              prepend-icon="add"
              class="text-none font-weight-bold hero-btn hero-btn-primary"
              @click="showAddInstance()"
            >
              {{ t('instances.add') }}
            </v-btn>
            <v-btn
              variant="outlined"
              color="white"
              prepend-icon="store"
              class="text-none hero-btn-outlined"
              to="/store"
            >
              {{ t('store.name', 2) }}
            </v-btn>
            <v-btn
              variant="outlined"
              color="white"
              prepend-icon="settings"
              class="text-none hero-btn-outlined"
              to="/setting"
            >
              {{ t('setting.name', 2) }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Server Quick Connect -->
      <div v-if="adminServers.length > 0" class="server-corner">
        <div class="flex flex-nowrap gap-1.5">
          <div
            v-for="srv in adminServers"
            :key="srv.id"
            class="server-card"
            @click="connectToServer(srv)"
          >
            <div class="server-card-inner">
              <img v-if="!serverImgFailed[srv.host]" :src="'https://api.mcsrvstat.us/icon/' + srv.host" class="server-img" @error="onServerImgError(srv.host)" />
              <v-icon v-else size="18" color="white">dns</v-icon>
            </div>
            <div class="server-card-name">{{ srv.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-section animate-delay-1">
      <div class="stat-card rounded-xl p-5 cursor-pointer group" @click="goToInstances">
        <div class="flex items-center gap-4">
          <div class="stat-icon-circle stat-icon-primary">
            <v-icon size="22" color="white">inventory_2</v-icon>
          </div>
          <div class="min-w-0">
            <div class="stat-value text-2xl font-bold text-white">{{ displayInstances }}</div>
            <div class="stat-label text-white/40 text-xs font-semibold uppercase tracking-widest">{{ t('dashboard.totalInstances') }}</div>
          </div>
        </div>
      </div>
      <div class="stat-card rounded-xl p-5 cursor-pointer group" @click="goToStore">
        <div class="flex items-center gap-4">
          <div class="stat-icon-circle stat-icon-success">
            <v-icon size="22" color="white">play_circle</v-icon>
          </div>
          <div class="min-w-0">
            <div class="stat-value text-2xl font-bold text-white">{{ displayPlaytime }}</div>
            <div class="stat-label text-white/40 text-xs font-semibold uppercase tracking-widest">{{ t('dashboard.totalPlaytime') }}</div>
          </div>
        </div>
      </div>
      <div class="stat-card rounded-xl p-5 cursor-pointer group" @click="goToInstances">
        <div class="flex items-center gap-4">
          <div class="stat-icon-circle stat-icon-warning">
            <v-icon size="22" color="white">update</v-icon>
          </div>
          <div class="min-w-0">
            <div class="stat-value text-2xl font-bold text-white">{{ displayRecent }}</div>
            <div class="stat-label text-white/40 text-xs font-semibold uppercase tracking-widest">{{ t('dashboard.recentPlayed') }}</div>
          </div>
        </div>
      </div>
      <div class="stat-card rounded-xl p-5 cursor-pointer group" @click="goToMods">
        <div class="flex items-center gap-4">
          <div class="stat-icon-circle stat-icon-info">
            <v-icon size="22" color="white">folder</v-icon>
          </div>
          <div class="min-w-0">
            <div class="stat-value text-2xl font-bold text-white">{{ displayMods }}</div>
            <div class="stat-label text-white/40 text-xs font-semibold uppercase tracking-widest">{{ t('dashboard.totalMods') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Launch + News Grid -->
    <div class="lx-content animate-section animate-delay-2">
      <!-- Instances Section -->
      <div>
        <div v-if="recentInstances.length === 0" class="empty-state rounded-xl p-8 text-center">
          <v-icon size="64" color="white/20" class="mb-3">inventory_2</v-icon>
          <h3 class="text-lg font-semibold text-white/70 mb-2">{{ t('dashboard.noInstances') }}</h3>
          <p class="text-white/40 text-sm mb-4">{{ t('dashboard.noInstancesHint') }}</p>
          <v-btn color="primary" variant="flat" prepend-icon="add" @click="showAddInstance()">
            {{ t('instances.add') }}
          </v-btn>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="inst in recentInstances"
            :key="inst.path"
            v-context-menu="getInstanceContextMenu(inst)"
            class="instance-card"
            @click="launchInstance(inst)"
          >
            <div class="instance-card-main">
              <div class="instance-icon-wrap">
                <v-img
                  :src="getInstanceIcon(inst, undefined)"
                  :width="52"
                  :height="52"
                  class="instance-icon"
                />
                <div v-if="pinnedInstances.includes(inst.path)" class="pin-badge">
                  <v-icon size="10" color="white">push_pin</v-icon>
                </div>
              </div>
              <div class="instance-info">
                <div class="instance-info-top">
                  <h3 class="instance-name">{{ inst.name || 'Unknown' }}</h3>
                  <span v-if="getMCVersion(inst.runtime)" class="version-chip">{{ getMCVersion(inst.runtime) }}</span>
                </div>
                <p class="instance-runtime">{{ formatRuntime(inst.runtime) }}</p>
                <div class="instance-meta">
                  <v-icon size="12">schedule</v-icon>
                  <span>{{ formatDate(inst.lastAccessDate) }}</span>
                  <span v-if="inst.playtime" class="meta-dot">·</span>
                  <v-icon v-if="inst.playtime" size="12">timer</v-icon>
                  <span v-if="inst.playtime">{{ formatPlaytimeShort(inst.playtime) }}</span>
                </div>
              </div>
              <div class="instance-status-badge">
                <template v-if="getInstanceStatus(inst) === 'launching'">
                  <v-progress-circular indeterminate size="20" width="2" color="primary" />
                </template>
                <template v-else-if="getInstanceStatus(inst) === 'running'">
                  <span class="status-dot status-dot--green" />
                </template>
              </div>
              <div class="instance-actions">
                <v-btn
                  v-if="!inst.locked"
                  icon
                  variant="text"
                  size="small"
                  class="instance-btn-settings"
                  @click.stop="openSettings(inst)"
                >
                  <v-icon size="16">settings</v-icon>
                </v-btn>
                <v-btn
                  v-if="getInstanceStatus(inst) === 'idle'"
                  icon
                  variant="flat"
                  size="small"
                  color="primary"
                  class="instance-btn-play"
                  @click.stop="launchInstance(inst)"
                >
                  <v-icon size="18">play_arrow</v-icon>
                </v-btn>
                <v-btn
                  v-else-if="getInstanceStatus(inst) === 'running'"
                  icon
                  variant="flat"
                  size="small"
                  color="red"
                  class="instance-btn-stop"
                  @click.stop="stopInstance(inst)"
                >
                  <v-icon size="16">stop</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- News Section -->
      <div class="animate-section animate-delay-3">
        <div class="section-header">
          <v-icon color="error" class="text-red">newspaper</v-icon>
          <h2 class="text-xl font-bold text-white">{{ t('me.news') }}</h2>
          <span class="section-header-line" />
          <div class="flex-1" />
          <v-btn
            v-if="newsItems.length > 4"
            size="x-small"
            variant="text"
            class="text-white/40 hover:text-white/80 text-xs"
            @click="openLink('https://www.minecraft.net')"
          >
            {{ t('news.readMore') }} ›
          </v-btn>
        </div>
        <div v-if="newsItems.length === 0" class="text-white/30 text-sm text-center py-8">
          <v-icon size="32" class="mb-2">newspaper</v-icon>
          <p>{{ t('dashboard.noNews') }}</p>
        </div>
        <div v-else class="news-scroll" ref="newsScrollRef" @mouseenter="pauseAutoAdvance = true" @mouseleave="pauseAutoAdvance = false">
          <div
            v-for="article in newsItems"
            :key="article.id"
            class="news-card"
            @click="article.readMoreLink ? openLink(article.readMoreLink) : undefined"
          >
            <div class="news-card-media">
              <v-img
                v-if="article.playPageImage?.url"
                :src="article.playPageImage.url"
                cover
                width="100%"
                height="100%"
              />
              <div v-else class="news-card-media-placeholder">
                <v-icon size="24">newspaper</v-icon>
              </div>
            </div>
            <div class="news-card-body">
              <span class="news-card-tag" :style="{ backgroundColor: newsTagColor(article.tag) + '20', color: newsTagColor(article.tag) }">
                {{ article.tag || article.category }}
              </span>
              <h3 class="news-card-title">{{ article.title }}</h3>
              <p v-if="article.description" class="news-card-desc">{{ article.description }}</p>
              <span class="news-card-date">{{ formatDateStr(article.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { useDialog } from '@/composables/dialog'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'
import { kUserContext } from '@/composables/user'
import { injection } from '@/util/inject'
import { getInstanceIcon } from '@/util/favicon'
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { vContextMenu } from '@/directives/contextMenu'
import { useAdminData } from '@/composables/adminData'
import { kInstanceLaunch } from '@/composables/instanceLaunch'
import { useRouter } from 'vue-router'
import { kInstances } from '@/composables/instances'
import { useInstanceContextMenuFunc } from '@/composables/instanceContextMenu'
import { useInjectSidebarSettings } from '@/composables/sidebarSettings'
import type { Instance } from '@xmcl/instance'
import { useI18n } from 'vue-i18n'

onMounted(() => {
  startAutoAdvance()
})
onUnmounted(() => {
  stopAutoAdvance()
})

const { t } = useI18n()
const router = useRouter()
const { show: showAddInstance } = useDialog(AddInstanceDialogKey)
const { instances, selectedInstance } = injection(kInstances)
const { gameProfile } = injection(kUserContext)
const adminData = useAdminData()
const instanceLaunch = injection(kInstanceLaunch)

const adminServers = computed(() => adminData.serversList.value || [])

const serverImgFailed = ref<Record<string, boolean>>({})
function onServerImgError(host: string) {
  serverImgFailed.value[host] = true
}

async function connectToServer(srv: any) {
  if (instances.value.length === 0) return
  const last = [...instances.value].sort((a: any, b: any) => (b.lastAccessDate || 0) - (a.lastAccessDate || 0))[0]
  selectedInstance.value = last.path
  await nextTick()
  await instanceLaunch.launch('client', { server: { host: srv.host, port: srv.port || 25565 } })
}

const selectedPlayInstance = ref('')
const instanceMenuOpen = ref(false)
const playableInstances = computed(() => {
  return [...instances.value].sort((a, b) => (b.lastAccessDate || 0) - (a.lastAccessDate || 0))
})
const selectedPlayInstanceName = computed(() => {
  if (!selectedPlayInstance.value) return ''
  const inst = instances.value.find(i => i.path === selectedPlayInstance.value)
  return inst?.name || ''
})

function selectPlayInstance(inst: Instance) {
  selectedPlayInstance.value = inst.path
  instanceMenuOpen.value = false
}

function launchSelected() {
  if (!selectedPlayInstance.value) return
  const inst = instances.value.find(i => i.path === selectedPlayInstance.value)
  if (inst) {
    selectedInstance.value = inst.path
    router.push('/base-setting')
  }
}

watch(() => playableInstances.value.length, (len) => {
  if (len > 0 && !selectedPlayInstance.value) {
    selectedPlayInstance.value = playableInstances.value[0].path
  }
}, { immediate: true })

const greeting = computed(() => {
  const name = gameProfile.value?.name
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? t('dashboard.goodMorning') : hour < 18 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening')
  return name ? `${timeGreeting}, ${name}` : timeGreeting
})

const greetingIcon = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return 'nights_stay'
  if (hour < 12) return 'wb_sunny'
  if (hour < 17) return 'partly_cloudy_day'
  if (hour < 20) return 'wb_twilight'
  return 'nights_stay'
})

const getInstanceContextMenu = useInstanceContextMenuFunc()
const { pinnedInstances } = useInjectSidebarSettings()

const recentInstances = computed(() => {
  const sorted = [...instances.value]
    .sort((a, b) => (b.lastAccessDate || 0) - (a.lastAccessDate || 0))
  const pinned = sorted.filter(i => pinnedInstances.value.includes(i.path))
  const unpinned = sorted.filter(i => !pinnedInstances.value.includes(i.path))
  return [...pinned, ...unpinned].slice(0, 6)
})

const recentCount = computed(() => {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000
  return instances.value.filter(i => (i.lastAccessDate || 0) > week).length
})

const totalPlaytime = computed(() => {
  const total = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const totalSec = Math.floor(total / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

const modCount = computed(() => {
  return instances.value.length
})

const displayInstances = ref(0)
const displayPlaytime = ref('0')
const displayRecent = ref(0)
const displayMods = ref(0)

const countedInstances = computed(() => instances.value.length)
const countedRecent = computed(() => recentCount.value)

function formatPlaytimeAnim(milliseconds: number) {
  const totalSec = Math.floor(milliseconds / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

onMounted(() => {
  const targetInst = countedInstances.value
  const targetRecent = countedRecent.value
  const targetPlay = instances.value.reduce((acc, i) => acc + (i.playtime || 0), 0)
  const targetMods = modCount.value
  const duration = 800
  const step = 16
  const steps = duration / step
  let frame = 0
  const timer = setInterval(() => {
    frame++
    const progress = Math.min(frame / steps, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    displayInstances.value = Math.round(targetInst * ease)
    displayRecent.value = Math.round(targetRecent * ease)
    displayMods.value = Math.round(targetMods * ease)
    displayPlaytime.value = formatPlaytimeAnim(Math.round(targetPlay * ease))
    if (progress >= 1) clearInterval(timer)
  }, step)
})

function goToInstances() { router.push('/') }
function goToMods() { router.push('/mods') }
function goToStore() { router.push('/store') }

const newsItems = computed(() => {
  return (adminData.newsList.value || [])
    .map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      playPageImage: n.imageUrl ? { url: n.imageUrl } : undefined,
      tag: n.tag,
      category: n.tag,
      date: n.date,
      readMoreLink: n.imageUrl || undefined,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const newsScrollRef = ref<HTMLDivElement | null>(null)
const pauseAutoAdvance = ref(false)
let autoAdvanceTimer: ReturnType<typeof setInterval> | null = null

function startAutoAdvance() {
  if (autoAdvanceTimer) clearInterval(autoAdvanceTimer)
  autoAdvanceTimer = setInterval(() => {
    if (pauseAutoAdvance.value || !newsScrollRef.value) return
    const scroll = newsScrollRef.value
    const maxScroll = scroll.scrollWidth - scroll.clientWidth
    if (scroll.scrollLeft >= maxScroll - 10) {
      scroll.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      scroll.scrollBy({ left: 320, behavior: 'smooth' })
    }
  }, 6000)
}

function stopAutoAdvance() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

watch(newsItems, () => {
  startAutoAdvance()
})

function getMCVersion(runtime: any): string {
  return runtime?.minecraft || ''
}

function formatRuntime(runtime: any) {
  const parts: string[] = []
  if (runtime?.minecraft) parts.push(runtime.minecraft)
  if (runtime?.forge) parts.push(`Forge ${runtime.forge}`)
  if (runtime?.fabricLoader) parts.push(`Fabric ${runtime.fabricLoader}`)
  if (runtime?.quiltLoader) parts.push(`Quilt ${runtime.quiltLoader}`)
  if (runtime?.neoForged) parts.push(`NeoForge ${runtime.neoForged}`)
  return parts.join(' + ') || t('dashboard.unknownVersion')
}

function formatPlaytimeShort(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return `${hours}h`
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

function formatDateStr(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function newsTagColor(tagName: string) {
  const found = adminData.tagsList.value.find((t: any) => t.name === tagName)
  return found ? found.color : '#888'
}

function getInstanceStatus(inst: Instance): 'idle' | 'launching' | 'running' {
  if (instanceLaunch.launching.value && selectedInstance.value === inst.path) {
    return 'launching'
  }
  const running = instanceLaunch.gameProcesses.value?.find(p => p.options.gameDirectory === inst.path)
  if (running) return 'running'
  return 'idle'
}

function stopInstance(inst: Instance) {
  selectedInstance.value = inst.path
  instanceLaunch.kill()
}

function launchInstance(inst: Instance) {
  selectedInstance.value = inst.path
  nextTick(() => {
    instanceLaunch.launch()
  })
}

function openSettings(inst: Instance) {
  selectedInstance.value = inst.path
  router.push('/base-setting')
}

function openLink(url: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Custom scrollbar */
.dashboard::-webkit-scrollbar {
  width: 6px;
}

.dashboard::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.dashboard::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.lx-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}


.hero-bg-wrapper {
  position: relative;
  width: 100%;
  min-height: 140px;
  border-radius: 14px;
  overflow: hidden;
}

/* === BASE === */
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #040d0a 0%, color-mix(in srgb, var(--color-primary) 8%, #050505) 40%, #030e08 100%);
}

/* === BLOBS === */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(55px);
  animation: blob-drift linear infinite;
}

@keyframes blob-drift {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(8px, -6px) scale(1.04); }
  66%  { transform: translate(-5px, 4px) scale(0.97); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.blob-1 {
  width: 220px; height: 220px;
  background: var(--color-primary); opacity: 0.15;
  top: -70px; left: 8%;
  animation-duration: 9s;
}
.blob-2 {
  width: 140px; height: 140px;
  background: var(--color-primary); opacity: 0.1;
  top: 30px; left: 38%;
  animation-duration: 12s;
  animation-delay: -3s;
}
.blob-3 {
  width: 170px; height: 170px;
  background: var(--color-primary); opacity: 0.12;
  bottom: -50px; left: 22%;
  animation-duration: 14s;
  animation-delay: -6s;
}
.blob-4 {
  width: 110px; height: 110px;
  background: var(--color-primary); opacity: 0.1;
  bottom: -20px; right: 28%;
  animation-duration: 10s;
  animation-delay: -2s;
}
.blob-5 {
  width: 90px; height: 90px;
  background: var(--color-primary); opacity: 0.07;
  top: 10px; right: 12%;
  animation-duration: 11s;
  animation-delay: -5s;
}
.blob-6 {
  width: 60px; height: 60px;
  background: var(--color-primary); opacity: 0.09;
  top: 55px; left: 62%;
  animation-duration: 8s;
  animation-delay: -1s;
}

/* === SPARKS === */
.spark {
  position: absolute;
  border-radius: 50%;
  filter: blur(12px);
  animation: spark-pulse ease-in-out infinite;
}

@keyframes spark-pulse {
  0%, 100% { opacity: var(--op-lo); transform: scale(1); }
  50%       { opacity: var(--op-hi); transform: scale(1.3); }
}

.sp1 {
  width: 18px; height: 18px;
  background: var(--color-primary);
  --op-lo: 0.4; --op-hi: 0.85;
  top: 18px; left: 23%;
  animation-duration: 3.2s;
}
.sp2 {
  width: 12px; height: 12px;
  background: #fff;
  --op-lo: 0.2; --op-hi: 0.6;
  top: 72px; left: 54%;
  animation-duration: 4.1s;
  animation-delay: -1.2s;
}
.sp3 {
  width: 22px; height: 22px;
  background: var(--color-primary);
  --op-lo: 0.3; --op-hi: 0.7;
  bottom: 14px; left: 71%;
  animation-duration: 2.8s;
  animation-delay: -0.5s;
}
.sp4 {
  width: 10px; height: 10px;
  background: #fff;
  --op-lo: 0.15; --op-hi: 0.5;
  top: 30px; right: 18%;
  animation-duration: 3.7s;
  animation-delay: -2s;
}
.sp5 {
  width: 14px; height: 14px;
  background: var(--color-primary);
  --op-lo: 0.25; --op-hi: 0.65;
  bottom: 20px; left: 45%;
  animation-duration: 5s;
  animation-delay: -3s;
}
.sp6 {
  width: 8px; height: 8px;
  background: #fff;
  --op-lo: 0.1; --op-hi: 0.45;
  top: 50px; left: 82%;
  animation-duration: 3s;
  animation-delay: -1s;
}
.sp7 {
  width: 16px; height: 16px;
  background: var(--color-primary);
  --op-lo: 0.3; --op-hi: 0.75;
  top: 8px; left: 47%;
  animation-duration: 4.5s;
  animation-delay: -2.5s;
}

.avatar-glow-ring {
  position: relative;
  border-radius: 10px;
  padding: 2px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(255, 255, 255, 0.3) 50%, rgb(var(--v-theme-primary)) 100%);
  background-size: 200% 200%;
  animation: avatarGlow 4s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes avatarGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.avatar-glow-ring > * {
  border-radius: 8px;
  display: block;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-secondary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.hero-btn {
  height: 44px !important;
  font-size: 0.85rem !important;
  padding: 0 20px !important;
  border-radius: 12px !important;
  letter-spacing: 0.3px !important;
  text-transform: none !important;
}

.hero-btn-success {
  box-shadow: 0 2px 12px rgb(var(--v-theme-primary), 0.2) !important;
}

.hero-btn-primary {
  background: rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.hero-btn-primary:hover {
  transform: translateY(-2px) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25) !important;
}

.hero-btn-outlined {
  height: 44px !important;
  font-size: 0.85rem !important;
  padding: 0 20px !important;
  border-radius: 12px !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
}

.hero-btn-outlined:hover {
  border-color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.split-play-wrapper {
  position: relative;
}

.play-split-btn {
  display: flex;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.play-split-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.play-split-btn:active {
  transform: scale(0.98);
}

.play-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 28px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-family: inherit;
  transition: all 0.3s ease;
  flex: 1;
}

.play-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.play-main:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.05);
}

.play-main:not(:disabled):active {
  transform: scale(0.97);
}

/* Shine/reflection effect � covers entire split button */
.play-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  transform: skewX(-25deg);
  animation: shineMove 4s ease-in-out infinite;
  z-index: 2;
  pointer-events: none;
}

@keyframes shineMove {
  0%, 100% {
    left: -100%;
  }
  50% {
    left: 200%;
  }
}

.play-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.play-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: brightness(1.1);
}

.play-text-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  min-width: 80px;
}

.play-label {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.play-instance-name {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  line-height: 1.2;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.play-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
}

.play-instance-menu {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(30, 30, 50, 0.98) !important;
  backdrop-filter: blur(20px);
}

.play-instance-item {
  transition: background 0.15s ease;
}

.play-instance-item:hover {
  background: rgba(255, 255, 255, 0.06) !important;
}

.play-instance-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12) !important;
}
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.07) 0%, transparent 70%);
  pointer-events: none;
  border-radius: inherit;
  z-index: -1;
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle at bottom right, rgba(0, 0, 0, 0.25) 0%, transparent 70%);
  pointer-events: none;
  border-radius: inherit;
  z-index: -1;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.07);
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-circle {
  transform: scale(1.05);
}

/* Presence strip */
.stat-icon-primary {
  background: linear-gradient(135deg, rgba(98, 0, 234, 0.25) 0%, rgba(98, 0, 234, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(98, 0, 234, 0.15);
}

.stat-icon-success {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.25) 0%, rgba(76, 175, 80, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.stat-icon-warning {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.25) 0%, rgba(255, 152, 0, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
}

.stat-icon-info {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.25) 0%, rgba(33, 150, 243, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

.instance-card {
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.instance-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(var(--v-theme-primary), 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.instance-card-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.instance-icon-wrap {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}
.instance-icon {
  border-radius: 14px;
}
.instance-card:hover .instance-icon {
  transform: scale(1.05);
}

.instance-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.instance-info-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.instance-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.instance-runtime {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.instance-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 4px;
}
.meta-dot {
  color: rgba(255, 255, 255, 0.15);
}

.instance-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.instance-status-badge {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}
.status-dot--green {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.instance-btn-settings {
  border-radius: 8px !important;
  width: 32px !important;
  height: 32px !important;
  color: rgba(255, 255, 255, 0.25) !important;
  transition: all 0.2s ease !important;
}
.instance-btn-settings:hover {
  color: rgba(255, 255, 255, 0.7) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}
.instance-btn-play {
  border-radius: 10px !important;
  width: 36px !important;
  height: 36px !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2) !important;
  transition: all 0.2s ease !important;
}
.instance-btn-play:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.35) !important;
}
.instance-btn-stop {
  border-radius: 10px !important;
  width: 36px !important;
  height: 36px !important;
  background: rgba(239, 68, 68, 0.15) !important;
  transition: all 0.2s ease !important;
}
.instance-btn-stop:hover {
  transform: scale(1.08);
  background: rgba(239, 68, 68, 0.25) !important;
}

.version-chip {
  display: inline-block;
  padding: 0 7px;
  height: 20px;
  line-height: 20px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  flex-shrink: 0;
}

.pin-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #eab308, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(234, 179, 8, 0.35);
  pointer-events: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── News Scroll ── */
.news-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 4px;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.news-scroll::-webkit-scrollbar { height: 4px; }
.news-scroll::-webkit-scrollbar-track { background: transparent; }
.news-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

/* ── News Card ── */
.news-card {
  flex: 0 0 300px;
  scroll-snap-align: start;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.news-card:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* ── Card Media ── */
.news-card-media {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}
.news-card-media :deep(.v-img__img) {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.news-card:hover .news-card-media :deep(.v-img__img) {
  transform: scale(1.08);
}
.news-card-media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.15);
}

/* ── Card Body ── */
.news-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.news-card-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 10px;
  border-radius: 6px;
  align-self: flex-start;
  line-height: 1.4;
}
.news-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}
.news-card-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}
.news-card-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

/* ── Section Header ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.section-header-line {
  flex: 0 0 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.08);
}

/* Staggered entrance animations */
.animate-section {
  animation: fadeInUp 0.6s ease both;
}
.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-section {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* Responsive: stack to single column on small screens */
@media (max-width: 900px) {
  .lx-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard {
    padding: 12px !important;
  }

  .hero-bg-wrapper {
    padding: 20px;
    min-height: 200px;
  }

  .hero-secondary-actions {
    margin-left: 0;
    flex-wrap: wrap;
  }

  .hero-btn,
  .hero-btn-outlined {
    height: 38px !important;
    font-size: 0.75rem !important;
    padding: 0 14px !important;
  }

  .stat-icon-circle {
    width: 36px;
    height: 36px;
  }

  .stat-icon-circle .v-icon {
    font-size: 18px !important;
  }
}


/* Server Quick Connect Cards */
.server-corner {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.server-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.server-card-inner {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;
}

.server-card:hover .server-card-inner {
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.15);
}

.server-card:active .server-card-inner {
  transform: scale(0.92);
}

.server-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.server-card-name {
  font-size: 10px;
  font-weight: 600;
  color: transparent;
  white-space: nowrap;
  transition: color 0.3s ease;
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-card:hover .server-card-name {
  color: rgba(255, 255, 255, 0.7);
}

</style>





