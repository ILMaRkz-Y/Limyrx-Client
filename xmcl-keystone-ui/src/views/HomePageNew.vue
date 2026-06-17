<template>
  <div class="home-page-root">
    <!-- Background video -->
    <video
      ref="bgVideoRef"
      :src="cardVideoSrc"
      class="bg-video"
      :class="{ 'bg-video--green-fade': selectedVideoIndex === 2 }"
      autoplay
      loop
      muted
      playsinline
      @error="onBgVideoError"
    ></video>

    <!-- Glass card -->
    <div class="big-glass-card">
      <div class="card-content">
        <div class="card-header">
          <div class="card-header-left">
            <img src="http://launcher/media?path=C%3A%5CUsers%5Cutil%5CDownloads%5Cx-minecraft-launcher-master%5Clogo.png" class="card-logo" alt="logo" />
            <span class="card-title">Limyrx Client <span class="title-version">v1.0.0</span></span>
          </div>
          <div class="card-header-right">
            <div class="online-count">
              <span class="online-dot"></span>
              <span class="online-text">{{ onlinePlayers }} online</span>
            </div>
          </div>
        </div>

        <!-- Player profile greeting + Create Local Server inline -->
        <div class="player-profile">
          <div class="player-avatar-wrap">
            <img v-if="avatarUrl" :src="avatarUrl" class="player-avatar" alt="avatar" />
            <div v-else class="player-avatar-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div class="player-info">
            <div class="player-greeting">{{ greeting }},</div>
            <div class="player-name">{{ playerName }}</div>
          </div>
          <button class="create-server-btn" @click="router.push('/servers')" title="Create Local Server">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6" y2="6"/>
              <line x1="6" y1="18" x2="6" y2="18"/>
            </svg>
            <span class="create-server-label">Create Local Server</span>
          </button>
        </div>

        <!-- Rotating tagline in the center -->
        <div class="tagline-container">
          <Transition name="tagline-fade" mode="out-in">
            <p class="tagline-text" :key="taglineIndex">{{ taglines[taglineIndex] }}</p>
          </Transition>
        </div>

        <!-- Server icons on the right -->
        <div v-if="serversList.length > 0" ref="serverIconsWrapRef" class="server-icons-wrap">
          <div class="server-icons">
            <div
              v-for="(srv, idx) in serversList"
              :key="srv.id"
              :ref="el => setIconRef(el, idx)"
              class="server-icon"
              @mouseenter="onServerHover(srv, idx, $event)"
              @mouseleave="onServerLeave"
              @click="copyServerIp(srv.host, srv.port)"
            >
              <div class="server-icon-img-wrap">
                <img
                  v-if="!serverImgFailed[srv.host]"
                  :src="'https://api.mcsrvstat.us/icon/' + srv.host"
                  class="server-icon-img"
                  @error="onServerImgError(srv.host)"
                />
                <svg v-else class="server-icon-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                  <line x1="6" y1="6" x2="6" y2="6"/>
                  <line x1="6" y1="18" x2="6" y2="18"/>
                </svg>
              </div>
              <span class="server-icon-name">{{ srv.name }}</span>
            </div>
          </div>
          <!-- Floating tooltip outside the scroll container -->
          <div v-if="hoveredSrv" ref="tooltipRef" class="server-icon-floating-tooltip" :style="tooltipStyle" @click="copyServerIp(hoveredSrv.host, hoveredSrv.port)">
            <span>{{ hoveredSrv.port && hoveredSrv.port !== 25565 ? hoveredSrv.host + ':' + hoveredSrv.port : hoveredSrv.host }}</span>
            <svg class="server-icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </div>
        </div>

        <!-- Bottom actions: Play button with dropdown menu -->
        <div class="bottom-actions">
          <div class="bottom-actions-inner">
            <button
              class="play-btn"
              :class="{ 'play-btn--launching': launchLoading && !isRunning, 'play-btn--running': isRunning }"
              :disabled="launchLoading"
              @click="onPlayClick"
              @contextmenu.prevent="openMenuAtMouse($event)"
            >
              <svg v-if="!launchLoading && !isRunning && leftIcon === 'play_arrow'" class="play-icon-big" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else-if="!launchLoading && !isRunning && leftIcon !== 'play_arrow'" class="play-icon-big" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 13h18v-2H5V3l-4 7 4 7z"/>
              </svg>
              <svg v-else-if="!launchLoading && isRunning && launchIcon === 'close'" class="play-icon-big" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
              <svg v-else class="play-icon-big spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <span class="play-label">{{ text }}</span>
              <span class="play-version">1.8.9</span>
              <span class="play-arrow-trigger" @click.stop="openMenuAtMouse($event)" title="More options">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Context menu at mouse position (outside card to avoid overflow clipping) -->
    <div
      v-if="showMenu"
      class="play-context-menu"
      :style="{ left: menuPos.x + 'px', top: menuPos.y + 'px' }"
      @click.stop
    >
      <button class="play-context-item" @click="onSettingsClick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        <span>Settings</span>
      </button>
      <button class="play-context-item" @click="onSelectInstance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span>Select another instance</span>
      </button>
      <button class="play-context-item" @click="onCreateInstance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Create new instance</span>
      </button>
    </div>

    <!-- Video selector buttons (bottom-right, outside card) -->
    <div class="video-selector">
      <button
        v-for="(_, idx) in videoFiles"
        :key="idx"
        class="video-selector-btn"
        :class="{ active: selectedVideoIndex === idx }"
        @click="selectedVideoIndex = idx"
        :title="'BG Video ' + (idx + 1)"
      >
        <span class="video-selector-dot"></span>
      </button>
    </div>

    <!-- Play/Pause video button -->
    <button class="video-playpause-btn" @click="toggleVideo" :title="videoPaused ? 'Play' : 'Pause'">
      <svg v-if="videoPaused" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
      </svg>
    </button>

    <!-- Announcement banners on the right side -->
    <div class="announcements-stack">
      <div class="announcement-banner">
        <img :src="announcementSrc" class="announcement-img" alt="announcement" />
        <div class="announcement-overlay">
          <div class="announcement-title">bro hit 350 FPS on a Dell laptop 💀</div>
          <div class="announcement-desc">no cap, LIMYRX is built different. lightweight, fast, and free — your potato PC will thank you fr.</div>
        </div>
      </div>
      <div class="announcement-banner">
        <img :src="announcementSrc2" class="announcement-img" alt="announcement 2" />
        <div class="announcement-overlay">
          <div class="announcement-title">Earn Lyx Orbs by:</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { useOnlinePlayers } from '@/composables/onlinePlayers'
import { useAdminData, type AdminServer } from '@/composables/adminData'
import { kUserContext } from '@/composables/user'
import { kLaunchButton } from '@/composables/launchButton'
import { kInstances } from '@/composables/instances'
import { injection } from '@/util/inject'
import { useRouter } from 'vue-router'
import { useService } from '@/composables'
import { useDialog } from '@/composables/dialog'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'
import { InstanceServiceKey, SystemModsServiceKey } from '@xmcl/runtime-api'

const bgVideoRef = ref<HTMLVideoElement | null>(null)
const videoPaused = ref(false)
function toggleVideo() {
  videoPaused.value = !videoPaused.value
  if (bgVideoRef.value) {
    if (videoPaused.value) bgVideoRef.value.pause()
    else bgVideoRef.value.play()
  }
}

// Reuse the existing online players counter from Firebase presence
const { playerCount: onlinePlayers } = useOnlinePlayers()

// User profile & time-based greeting
const { gameProfile, userProfile } = injection(kUserContext)
const playerName = computed(() => gameProfile.value?.name || userProfile.value?.username || 'Player')
const playerUuid = computed(() => gameProfile.value?.id || '')
const avatarUrl = computed(() => {
  const name = playerName.value
  if (name && name !== 'Player') return `https://render.crafty.gg/3d/bust/${name}?y=55`
  return ''
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
})

// ===== Tagline rotator =====
const taglines = [
  'Built different. Built free.',
  'No limits. No lag. No cost.',
  'Your edge starts here.',
  'Light on your PC. Heavy on your opponents.',
  'Free forever. Fast always.',
  'The client your potato PC deserves.',
]
const taglineIndex = ref(0)
let taglineInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  taglineInterval = setInterval(() => {
    taglineIndex.value = (taglineIndex.value + 1) % taglines.length
  }, 2500)
})

onUnmounted(() => {
  if (taglineInterval) clearInterval(taglineInterval)
})
// =================================

// Servers from admin panel
const { serversList } = useAdminData()
const serverImgFailed = ref<Record<string, boolean>>({})
function onServerImgError(host: string) {
  serverImgFailed.value[host] = true
}

// Hovered server tooltip (positioned outside scroll container)
const hoveredSrv = ref<AdminServer | null>(null)
const hoveredIndex = ref(-1)
const tooltipStyle = ref<Record<string, string>>({})
const serverIconsWrapRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const iconRefs = ref<(HTMLElement | null)[]>([])

function setIconRef(el: any, idx: number) {
  iconRefs.value[idx] = el as HTMLElement | null
}

function onServerHover(srv: AdminServer, idx: number, event: MouseEvent) {
  hoveredSrv.value = srv
  hoveredIndex.value = idx
  const el = iconRefs.value[idx]
  if (el && serverIconsWrapRef.value) {
    const wrapRect = serverIconsWrapRef.value.getBoundingClientRect()
    const iconRect = el.getBoundingClientRect()
    // Position tooltip to the LEFT of the icon, vertically aligned
    tooltipStyle.value = {
      top: `${iconRect.top - wrapRect.top + iconRect.height / 2}px`,
      right: `calc(100% + 8px)`,
      transform: 'translateY(-50%)',
    }
  }
}

function onServerLeave() {
  hoveredSrv.value = null
  hoveredIndex.value = -1
}

// Copy IP to clipboard
function copyServerIp(host: string, port: number) {
  const addr = port && port !== 25565 ? `${host}:${port}` : host
  navigator.clipboard.writeText(addr)
}

// Play button handlers – uses kLaunchButton facade for full install/launch/kill logic
const { show: showAddInstanceDialog } = useDialog(AddInstanceDialogKey)
const router = useRouter()
const { instances, selectedInstance } = injection(kInstances)
const { onClick: launchBtnClick, text, loading: launchLoading, icon: launchIcon, leftIcon, count } = injection(kLaunchButton)
const { createInstance, deleteInstance } = useService(InstanceServiceKey)
const systemMods = useService(SystemModsServiceKey)

const isRunning = computed(() => count.value > 0)
const limyrxInstance = computed(() => instances.value.find(i => i.name === 'Limyrx Client'))

async function getForgeVersion(mc: string): Promise<string> {
  try {
    const res = await fetch(`https://bmclapi2.bangbang93.com/forge/minecraft/${mc}`)
    if (res.ok) {
      const list: any[] = await res.json()
      const recommended = list.find(v => v.type === 'recommended' || v.type === 'latest')
      if (recommended) return recommended.version
    }
  } catch {}
  // Fallback known-good forge version for 1.8.9
  return '11.15.1.2318'
}

async function ensureLimyrxInstance() {
  let inst = limyrxInstance.value
  if (!inst) {
    // Clean up any auto-created default instances
    const others = instances.value.filter(i => i.name !== 'Limyrx Client')
    for (const old of others) {
      await deleteInstance(old.path, true).catch(() => {})
    }
    // Get the forge version
    const forgeVer = await getForgeVersion('1.8.9')
    const newPath = await createInstance({
      name: 'Limyrx Client',
      runtime: { minecraft: '1.8.9', forge: forgeVer },
      icon: '',
      author: '',
      description: 'Limyrx Client - Minecraft 1.8.9 Forge',
      vmOptions: [],
      mcOptions: [],
    })
    inst = { path: newPath, name: 'Limyrx Client' } as any
  }
  // Install system mods before launching
  await systemMods.ensureSystemMods(inst.path).catch(e => console.error('Failed to install system mods', e))
  // Select this instance
  selectedInstance.value = inst.path
  return inst
}
async function onPlayClick() {
  await ensureLimyrxInstance()
  // Small delay for the context to pick up the new selected instance
  await nextTick()
  launchBtnClick()
}
function onSettingsClick() {
  showMenu.value = false
  router.push('/base-setting')
}

// ===== Play button context menu =====
const showMenu = ref(false)
const menuPos = ref({ x: 0, y: 0 })

function openMenuAtMouse(e: MouseEvent) {
  if (showMenu.value) {
    showMenu.value = false
    return
  }
  menuPos.value = { x: e.clientX, y: e.clientY }
  showMenu.value = true
}

function onSelectInstance() {
  showMenu.value = false
  router.push('/home')
}

function onCreateInstance() {
  showMenu.value = false
  showAddInstanceDialog()
}

// Close menu on click anywhere
function closeMenu(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.play-context-menu') && !target.closest('.play-btn')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

// Announcement image
const announcementPath = 'C:\\Users\\util\\Downloads\\ChatGPT Image 13 يونيو 2026، 06_20_54 م.png'
const announcementSrc = computed(() => {
  try {
    return `http://launcher/media?path=${encodeURIComponent(announcementPath)}`
  } catch {
    return ''
  }
})

const announcementPath2 = 'C:\\Users\\util\\Downloads\\ChatGPT Image 2 juin 2026, 19_01_29.png'
const announcementSrc2 = computed(() => {
  try {
    return `http://launcher/media?path=${encodeURIComponent(announcementPath2)}`
  } catch {
    return ''
  }
})

// Video file paths served through the launcher's media protocol
const videoFiles = [
  'C:\\Users\\util\\Downloads\\x-minecraft-launcher-master\\From Klickpin.com- Bookmark these 19 Minimal bathroom storage solutions that are worth saving if you love elegant details and creative inspiration.mp4',
  'C:\\Users\\util\\Downloads\\From Klickpin.com- Try Practical DIY gift ideas for your next Pinterest save using practical inspiration that still feels highly aesthetic-pin-id-.mp4',
  'C:\\Users\\util\\Downloads\\From Klickpin.com- Dreamy Sleep Routine Tips on a Budget-pin-id-949767008927098912.mp4',
]
const selectedVideoIndex = ref(0)
const cardVideoSrc = computed(() => {
  try {
    return `http://launcher/media?path=${encodeURIComponent(videoFiles[selectedVideoIndex.value])}`
  } catch {
    return ''
  }
})

function onBgVideoError() {
  console.warn('Background video failed to load')
  if (bgVideoRef.value) {
    bgVideoRef.value.style.display = 'none'
  }
}
</script>

<style scoped>
.home-page-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  background: #1a1a2e;
}



/* ===== Background video ===== */
.bg-video {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  /* Fade out the right edge so it blends smoothly into the dark bg */
  -webkit-mask-image: linear-gradient(
    to right,
    black 0%,
    black 65%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    black 0%,
    black 65%,
    transparent 100%
  );
}

.bg-video--green-fade {
  box-shadow: 15px 0 40px rgba(0, 100, 0, 0.5), 0 0 60px rgba(0, 80, 0, 0.2);
}

/* ===== Glass Card ===== */
.big-glass-card {
  position: absolute;
  left: 3vw;
  top: 50%;
  transform: translateY(-50%);
  width: 68vw;
  max-width: 960px;
  height: 82vh;
  max-height: 800px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 2;

  /* Performance: promote to GPU layer */
  will-change: transform;

  background: rgba(10, 10, 18, 0.35);        /* slightly darker = less blur needed */
  backdrop-filter: blur(5px) saturate(1.3);   /* reduced from 7px */
  -webkit-backdrop-filter: blur(5px) saturate(1.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.35);

  /* Only animate transform + box-shadow — avoid border-color repaint */
  transition:
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Card hover animation - lifts up and glows */
.big-glass-card:hover {
  transform: translateY(calc(-50% - 6px));
  box-shadow:
    0 16px 60px rgba(0, 0, 0, 0.45),
    0 0 40px rgba(255, 255, 255, 0.05);
}

/* Refraction overlay — replaced with a simpler pseudo-element that doesn't re-paint */
.big-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.04) 0%,
    transparent 45%,
    rgba(0, 0, 0, 0.08) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* Card content */
.card-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 32px;
}

/* Card header - full width with left/right sections */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
}

/* Card title at the top — removed text-shadow (cheap but unnecessary compositing) */
.card-title {
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.05em;
}

.title-version {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.6;
  margin-left: 4px;
}

/* Player profile with greeting */
.player-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
}

.player-avatar-wrap {
  width: 80px;
  height: 80px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}

.player-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.player-avatar-placeholder {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.3);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.create-server-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.create-server-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
}

.create-server-btn:active {
  transform: scale(0.96);
}

.create-server-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.create-server-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.player-greeting {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.2;
}

.player-name {
  font-size: 17px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
}

/* Update badge */
/* Online count */
.online-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  /* Only animate opacity + transform — GPU-friendly */
  animation: pulse-dot 2s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.online-text {
  /* inherits from parent */
}

/* ===== Server icons on the right ===== */
.server-icons-wrap {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
}

.server-icons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  max-height: 60vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 10px 6px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 14px, black calc(100% - 14px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 14px, black calc(100% - 14px), transparent 100%);
}

/* Smooth slide animation for each server icon — optimized */
.server-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  position: relative;
  will-change: transform, opacity;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease;
  opacity: 0;
  animation: slideInIcon 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.server-icon:hover {
  transform: scale(1.12);
}

.server-icon:active {
  transform: scale(0.94);
}

@keyframes slideInIcon {
  from {
    opacity: 0;
    transform: translateX(15px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Stagger delay for each icon — reduced total delay from 0.5s to 0.3s */
.server-icon:nth-child(1) { animation-delay: 0.03s; }
.server-icon:nth-child(2) { animation-delay: 0.06s; }
.server-icon:nth-child(3) { animation-delay: 0.09s; }
.server-icon:nth-child(4) { animation-delay: 0.12s; }
.server-icon:nth-child(5) { animation-delay: 0.15s; }
.server-icon:nth-child(6) { animation-delay: 0.18s; }
.server-icon:nth-child(7) { animation-delay: 0.21s; }
.server-icon:nth-child(8) { animation-delay: 0.24s; }
.server-icon:nth-child(9) { animation-delay: 0.27s; }
.server-icon:nth-child(10) { animation-delay: 0.3s; }

.server-icon-img-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.server-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.server-icon-fallback {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.3);
}

.server-icon-name {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.server-icon:hover .server-icon-name {
  color: rgba(255, 255, 255, 0.85);
}


/* Floating tooltip - rendered outside the scroll container */
.server-icon-floating-tooltip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(10, 10, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 5px 10px;
  z-index: 100;
  pointer-events: auto;
  transition: opacity 0.12s ease;
  animation: tooltipPop 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes tooltipPop {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.server-icon-copy {
  width: 13px;
  height: 13px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.server-icon-floating-tooltip:hover .server-icon-copy {
  color: rgba(255, 255, 255, 0.9);
}

/* ===== Announcement banners stack on the right side ===== */
.announcements-stack {
  position: absolute;
  right: 3vw;
  top: 9vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 3;
}

.announcement-banner {
  width: 280px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
}

.announcement-banner:hover {
  transform: scale(1.03);
  
}

.announcement-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.announcement-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px 14px;
  background: transparent;
  pointer-events: none;
}

.announcement-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 4px;
}

.announcement-desc {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}


/* ===== Rotating tagline in the center ===== */
.tagline-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  min-height: 80px;
}

.tagline-text {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.04em;
  line-height: 1.3;
  margin: 0;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 200, 0.5),
    0 0 80px rgba(255, 200, 100, 0.3),
    0 0 150px rgba(255, 180, 50, 0.15);
}

/* Vue transition for tagline fade */
.tagline-fade-enter-active,
.tagline-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tagline-fade-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.tagline-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}

/* ===== Bottom actions: Play button + Settings icon ===== */
.bottom-actions {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
  margin-bottom: 10px;
}

.bottom-actions-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 36px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(76, 175, 80, 0.35);    /* slightly darker = remove need for backdrop-filter */
  color: #fff;
  cursor: pointer;
  /* Only transition GPU-friendly properties */
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.25s ease,
              background 0.25s ease;
  box-shadow: 0 6px 28px rgba(76, 175, 80, 0.3);
  will-change: transform;
}

.play-btn:hover {
  transform: scale(1.05);
  background: rgba(76, 175, 80, 0.5);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.5), 0 0 25px rgba(76, 175, 80, 0.2);
}

.play-btn--running {
  background: rgba(239, 68, 68, 0.35);
  border-color: rgba(239, 68, 68, 0.35);
  box-shadow: 0 6px 28px rgba(239, 68, 68, 0.3);
}

.play-btn--running:hover {
  background: rgba(239, 68, 68, 0.5);
  border-color: rgba(239, 68, 68, 0.55);
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.5), 0 0 25px rgba(239, 68, 68, 0.2);
}

.play-btn--running .play-version {
  background: rgba(255, 255, 255, 0.25);
}

.play-btn:active {
  transform: scale(0.95);
}

.play-btn--launching {
  opacity: 0.7;
  cursor: wait;
  pointer-events: none;
}

.play-btn--launching:hover {
  transform: none;
  box-shadow: 0 6px 28px rgba(76, 175, 80, 0.3);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.play-icon-big {
  width: 26px;
  height: 26px;
}

.play-label {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.play-version {
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
  padding: 3px 10px;
  border-radius: 8px;
  opacity: 0.85;
}

.play-arrow-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
  flex-shrink: 0;
}

.play-arrow-trigger:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.play-arrow-trigger svg {
  width: 16px;
  height: 16px;
}

/* ===== Standalone settings icon button ===== */
/* ===== Context menu at mouse position ===== */
.play-context-menu {
  position: fixed;
  min-width: 210px;
  background: rgba(10, 10, 18, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 6px;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  animation: contextIn 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes contextIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.play-context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
}

.play-context-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.play-context-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.6;
}

.play-context-item:hover svg {
  opacity: 1;
}

/* ===== Video selector ===== */
.video-selector {
  position: absolute;
  left: 3vw;
  width: 68vw;
  max-width: 960px;
  top: calc(50% + 41vh + 6px);
  z-index: 10;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
}

.video-selector-btn {
  pointer-events: auto;
}

.video-selector-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(10, 10, 18, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  will-change: transform;
}

.video-selector-btn:hover {
  transform: scale(1.15);
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(10, 10, 18, 0.6);
}

.video-selector-btn.active {
  border-color: rgba(76, 175, 80, 0.6);
  background: rgba(76, 175, 80, 0.25);
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.4);
}

.video-selector-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.2s ease;
}

.video-selector-btn.active .video-selector-dot {
  background: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
}

.video-selector-btn:hover .video-selector-dot {
  background: rgba(255, 255, 255, 0.6);
}

/* ===== Play/Pause video button (bottom-right) ===== */
.video-playpause-btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(10, 10, 18, 0.4);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.video-playpause-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.video-playpause-btn svg {
  width: 16px;
  height: 16px;
}
</style>
