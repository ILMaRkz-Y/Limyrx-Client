<template>
  <div ref="rootEl" class="splash-screen" :class="{ 'splash-fadeout': fading }">
    <!-- MCPVP Nether Background -->
    <div class="mcpvp-bg" aria-hidden="true">
      <img class="layer layer-rear" :src="rear" alt="" draggable="false"/>
      <img class="layer layer-sea" :src="sea" alt="" draggable="false"/>
      <img class="layer layer-foreground" :src="foreground" alt="" draggable="false"/>

      <!-- Ghast 1: Big, slow -->
      <div class="ghast-wrap" style="top:20%; animation: ghast-drift 72s linear 0s infinite;">
        <div class="ghast-inner" style="--bob-dur:8s; --amp:18px;">
          <img :src="ghastBig" alt="" width="288" height="288" draggable="false"/>
        </div>
      </div>
      <!-- Ghast 2: Big, flipped -->
      <div class="ghast-wrap" style="top:40%; animation: ghast-drift 58s linear -12s infinite;">
        <div class="ghast-inner" style="--bob-dur:7s; --amp:14px;">
          <img :src="ghastBig" alt="" width="240" height="240" draggable="false" style="transform:scaleX(-1)"/>
        </div>
      </div>
      <!-- Ghast 3: Small, faded -->
      <div class="ghast-wrap" style="top:15%; animation: ghast-drift 88s linear -30s infinite; opacity:0.6;">
        <div class="ghast-inner" style="--bob-dur:10s; --amp:22px;">
          <img :src="ghastSmall" alt="" width="180" height="180" draggable="false"/>
        </div>
      </div>
      <!-- Ghast 4: Small, flipped, faded -->
      <div class="ghast-wrap" style="top:55%; animation: ghast-drift 64s linear -45s infinite; opacity:0.7;">
        <div class="ghast-inner" style="--bob-dur:6.5s; --amp:10px;">
          <img :src="ghastSmall" alt="" width="144" height="144" draggable="false" style="transform:scaleX(-1)"/>
        </div>
      </div>

      <!-- Overlays -->
      <div class="overlay-gradient"></div>
      <div class="overlay-red"></div>
      <div class="overlay-noise"></div>
    </div>

    <!-- Tooltip -->
    <div ref="tooltipEl" class="block-tooltip"></div>

    <!-- Center content: Logo + title + block loading bar -->
    <div class="splash-center" :class="{ 'fade-out': loadingAreaHidden }">
      <img :src="logo" alt="Limyrx" class="splash-logo" draggable="false"/>
      <div class="splash-title">Limyrx Client</div>

      <!-- Loading text with typing effect -->
      <div class="loading-text">{{ loadingText }}</div>

      <!-- Block row -->
      <div class="block-row">
        <img
          v-for="(block, i) in placedBlocks"
          :key="i"
          :src="block.imgSrc"
          :class="[
            'block',
            block.effect,
            { clicked: clickedBlocks.has(i) }
          ]"
          :style="blockStyles[i] || {}"
          alt=""
          draggable="false"
          :data-name="block.name"
          @mouseenter="onBlockHover($event, i, block)"
          @mousemove="onBlockMove($event)"
          @mouseleave="onBlockLeave(i, block)"
          @click="onBlockClick($event, i)"
        />
      </div>

      <!-- Progress text -->
      <div class="progress-text">{{ displayPct }}%</div>
    </div>

    <!-- Explosion overlay -->
    <div ref="overlayEl" class="explosion-overlay" :class="{ active: explosionActive }">
      <video ref="videoEl" playsinline preload="auto" class="explosion-video"></video>
    </div>

    <!-- Bottom-left random tip -->
    <div class="splash-tip">
      <span class="splash-tip-icon">✦</span>
      {{ currentTip }}
    </div>

    <!-- Bottom-right skip button -->
    <div
      class="splash-toggle-btn"
      :class="{ 'splash-toggle-btn--hover': toggleHover, 'splash-toggle-btn--active': toggleActive }"
      @mouseenter="toggleHover = true"
      @mouseleave="toggleHover = false; toggleActive = false"
      @mousedown="toggleActive = true"
      @mouseup="toggleActive = false"
      @click="onSkipClick"
    >
      <span class="splash-toggle-label">SKIP</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import rear from '@/assets/mcpvp/rear.png'
import sea from '@/assets/mcpvp/sea-anim.webp'
import foreground from '@/assets/mcpvp/foreground.png'
import ghastBig from '@/assets/mcpvp/ghast-big.webp'
import ghastSmall from '@/assets/mcpvp/ghast-small.webp'
import logo from '@/assets/logo.webp'

import btnNormal from '@/assets/btn/normal.png'
import btnHover from '@/assets/btn/hover.png'
import btnActive from '@/assets/btn/active.png'

// Toggle button state
const toggleHover = ref(false)
const toggleActive = ref(false)

function onSkipClick() {
  if (fading.value || explosionActive.value) return
  showExplosion()
}

// Block images — served from public/ to avoid Vite bundling 14MB video
const blockGrass = 'loadingbar/block-grass.jpg'
const blockStone = 'loadingbar/block-stone.jpg'
const blockGlowstone = 'loadingbar/block-glowstone.jpg'
const blockDiamond = 'loadingbar/block-diamond.jpg'
const blockRedstone = 'loadingbar/block-redstone.jpg'
const blockJack = 'loadingbar/block-jack.jpg'
const blockTnt = 'loadingbar/block-tnt.jpg'
const blockCobblestone = 'loadingbar/block-cobblestone.jpg'
const blockIronOre = 'loadingbar/block-iron-ore.jpg'
const blockNetheriteSword = 'loadingbar/block-netherite-sword.jpg'
const blockAncientDebris = 'loadingbar/block-ancient-debris.jpg'
const blockCraftingTable = 'loadingbar/block-crafting-table.jpg'
const blockEmeraldOre = 'loadingbar/block-emerald-ore.jpg'
const blockNetherite = 'loadingbar/block-netherite.jpg'
const blockGoldOre = 'loadingbar/block-gold-ore.jpg'
const blockBabyChicken = 'loadingbar/block-baby-chicken.jpg'
const blockGold = 'loadingbar/block-gold.jpg'
const blockIronOre2 = 'loadingbar/block-iron-ore-2.jpg'
const blockQuartz = 'loadingbar/block-quartz.jpg'
const blockIron = 'loadingbar/block-iron.jpg'

// Audio & video
const blockSoundUrl = 'loadingbar/block-sound.mp3'
const explosionSoundUrl = 'loadingbar/explosion-sound.mp3'
const chickenSoundUrl = 'loadingbar/chicken-jockey.mp3'

const emit = defineEmits<{ done: [] }>()

/* ── Config ── */
const TOTAL_BLOCKS = 10

interface BlockData {
  imgSrc: string
  name: string
  effect: string
}

const POOL: BlockData[] = [
  { imgSrc: blockGrass,        name: 'Grass Block',        effect: '' },
  { imgSrc: blockStone,        name: 'Stone',              effect: '' },
  { imgSrc: blockCobblestone,  name: 'Cobblestone',        effect: '' },
  { imgSrc: blockGlowstone,    name: 'Glowstone',          effect: 'glowstone' },
  { imgSrc: blockDiamond,      name: 'Diamond Ore',        effect: 'diamond' },
  { imgSrc: blockRedstone,     name: 'Redstone Ore',       effect: 'redstone' },
  { imgSrc: blockJack,         name: "Jack o'Lantern",     effect: 'jack' },
  { imgSrc: blockIronOre,      name: 'Iron Ore',           effect: 'iron' },
  { imgSrc: blockNetheriteSword, name: 'Netherite Sword',  effect: 'netherite' },
  { imgSrc: blockAncientDebris,name: 'Ancient Debris',     effect: 'ancient' },
  { imgSrc: blockCraftingTable,name: 'Crafting Table',     effect: 'crafting' },
  { imgSrc: blockEmeraldOre,   name: 'Emerald Ore',        effect: 'emerald' },
  { imgSrc: blockNetherite,    name: 'Netherite Block',    effect: 'netherite' },
  { imgSrc: blockGoldOre,      name: 'Gold Ore',           effect: 'gold' },
  { imgSrc: blockBabyChicken,  name: 'Baby Chicken',       effect: 'chicken' },
  { imgSrc: blockGold,         name: 'Gold Block',         effect: 'gold' },
  { imgSrc: blockQuartz,       name: 'Quartz',             effect: '' },
  { imgSrc: blockIron,         name: 'Iron Block',         effect: 'iron' },
]

const TNT: BlockData = { imgSrc: blockTnt, name: 'TNT', effect: 'tnt' }

const MESSAGES = [
  'Generating world...',
  'Loading chunks...',
  'Preparing terrain...',
  'Placing blocks...',
  'Spawning mobs...',
  'Loading textures...',
  'Warming up furnace...',
  'Enchanting tools...',
  'Smelting ores...',
  'Igniting TNT...',
  'Brewing potions...',
  'Fishing for treasure...',
  'Mining diamonds...',
  'Feeding the cats...',
  'Taming wolves...',
]

const HOVER_GLOWS: Record<string, string> = {
  '':        'brightness(1.4) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  glowstone: 'brightness(1.5) drop-shadow(0 0 16px rgba(255,200,60,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  diamond:   'brightness(1.4) drop-shadow(0 0 16px rgba(0,200,255,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  redstone:  'brightness(1.4) drop-shadow(0 0 16px rgba(255,40,20,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  jack:      'brightness(1.5) drop-shadow(0 0 16px rgba(255,180,30,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  tnt:       'brightness(1.4) drop-shadow(0 0 16px rgba(255,60,20,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  iron:      'brightness(1.3) drop-shadow(0 0 12px rgba(200,200,210,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  netherite: 'brightness(1.3) drop-shadow(0 0 16px rgba(80,50,60,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  ancient:   'brightness(1.3) drop-shadow(0 0 14px rgba(180,60,40,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  crafting:  'brightness(1.3) drop-shadow(0 0 12px rgba(160,120,60,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  emerald:   'brightness(1.4) drop-shadow(0 0 16px rgba(255,220,50,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  gold:      'brightness(1.4) drop-shadow(0 0 16px rgba(255,215,0,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
  chicken:   'brightness(1.5) drop-shadow(0 0 12px rgba(255,240,180,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
}

/* ── Refs ── */
const rootEl = ref<HTMLElement>()
const tooltipEl = ref<HTMLElement>()
const overlayEl = ref<HTMLElement>()
const videoEl = ref<HTMLVideoElement>()

const placedBlocks = ref<BlockData[]>([])
const blockStyles = reactive<Record<number, Record<string, string>>>({})
const clickedBlocks = reactive(new Set<number>())
const loadingText = ref('Loading...')
const displayPct = ref(0)
const explosionActive = ref(false)
const loadingAreaHidden = ref(false)
const fading = ref(false)
const currentTip = ref('')

/* ── Audio ── */
const blockSound = new Audio(blockSoundUrl)
const explosionSound = new Audio(explosionSoundUrl)
const chickenSound = new Audio(chickenSoundUrl)
chickenSound.volume = 0.7

/* ── Timers ── */
let typingTimer: ReturnType<typeof setInterval> | null = null
let pctInterval: ReturnType<typeof setInterval> | null = null
let hoverInterval: ReturnType<typeof setInterval> | null = null
let wiggleAngle = 0
let currentPct = 0
let placed = 0
let totalTimer: ReturnType<typeof setTimeout> | null = null
let cleanupFns: (() => void)[] = []

/* ── Tips ── */
const tips = [
  'Tip: Drag instances between groups to organize your launcher',
  'Did you know? You can customize your sidebar in Settings',
  'Loading Nether portal data...',
  'Tip: Right-click any instance for more options',
  'Compiling chunk meshes...',
  'Tip: Use Ctrl+K to open the command palette',
  'Waiting for the Ender Dragon to wake up...',
  'Tip: Enable Developer Mode for extra tools',
  'Mining diamonds in the background...',
  'Tip: You can pin your favorite instances to the sidebar',
  'Feeding the cats...',
  'Tip: Check the Modrinth tab for new mods',
  'Smelting iron ore...',
  'Tip: Create groups to organize instances by modpack',
  'Exploring stronghold corridors...',
  'Tip: The AI assistant can help customize your UI',
  'Brewing potions of swiftness...',
  'Tip: Hold Shift while launching for safe mode',
  'Trading with villagers...',
  'Tip: You can set custom backgrounds in Settings',
  'Enchanting gear...',
  'Tip: Use Ctrl+Shift+A for the AI chat panel',
  'Building a redstone contraption...',
  'Tip: Backup your instances regularly',
  'Taming wolves...',
]

/* ── Typing effect ── */
function typeText(text: string, speed = 40, cb?: () => void) {
  loadingText.value = ''
  let i = 0
  if (typingTimer) clearInterval(typingTimer)
  typingTimer = setInterval(() => {
    loadingText.value = text.slice(0, i + 1)
    i++
    if (i >= text.length) {
      if (typingTimer) clearInterval(typingTimer)
      typingTimer = null
      if (cb) cb()
    }
  }, speed)
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ── Smooth percentage counter ── */
function smoothPct(target: number) {
  if (pctInterval) clearInterval(pctInterval)
  const start = currentPct
  const diff = target - start
  const steps = Math.max(Math.abs(diff), 1)
  const duration = 300
  const stepTime = duration / steps
  let i = 0
  pctInterval = setInterval(() => {
    i++
    const progress = i / steps
    currentPct = Math.round(start + diff * progress)
    displayPct.value = currentPct
    if (i >= steps) {
      if (pctInterval) clearInterval(pctInterval)
      pctInterval = null
      currentPct = target
      displayPct.value = target
    }
  }, stepTime)
}

/* ── Add block ── */
function addBlock(tnt = false) {
  const data = tnt ? TNT : randomFrom(POOL)
  placedBlocks.value = [...placedBlocks.value, data]
  placed++

  blockSound.currentTime = 0
  blockSound.play().catch(() => {})

  const pct = Math.round((placed / TOTAL_BLOCKS) * 100)
  smoothPct(pct)
  typeText(randomFrom(MESSAGES), 40)
}

/* ── Hover (JS inline styles — NOT CSS :hover) ── */
function onBlockHover(e: MouseEvent, index: number, block: BlockData) {
  const el = e.target as HTMLElement
  tooltipEl.value!.textContent = block.name
  tooltipEl.value!.classList.add('show')

  // Play chicken sound on hover
  if (block.effect === 'chicken') {
    chickenSound.currentTime = 0
    chickenSound.play().catch(() => {})
  }

  // Start wiggle
  blockStyles[index] = {
    transform: 'scale(1.25) translateY(-8px)',
    filter: HOVER_GLOWS[block.effect] || HOVER_GLOWS[''],
  }
  wiggleAngle = 0
  hoverInterval = setInterval(() => {
    wiggleAngle += 0.3
    const rot = Math.sin(wiggleAngle * 6) * 4
    blockStyles[index] = {
      transform: `scale(1.25) translateY(-8px) rotate(${rot}deg)`,
      filter: HOVER_GLOWS[block.effect] || HOVER_GLOWS[''],
    }
  }, 30)
}

function onBlockMove(e: MouseEvent) {
  if (tooltipEl.value) {
    tooltipEl.value.style.left = (e.clientX + 16) + 'px'
    tooltipEl.value.style.top = (e.clientY - 12) + 'px'
  }
}

function onBlockLeave(index: number, _block: BlockData) {
  if (hoverInterval) {
    clearInterval(hoverInterval)
    hoverInterval = null
  }
  tooltipEl.value!.classList.remove('show')
  delete blockStyles[index]
}

/* ── Click bounce ── */
function onBlockClick(e: MouseEvent, index: number) {
  const el = e.target as HTMLElement
  clickedBlocks.delete(index) // reset
  void el.offsetWidth // force reflow
  clickedBlocks.add(index)
  blockSound.currentTime = 0
  blockSound.play().catch(() => {})
  setTimeout(() => {
    clickedBlocks.delete(index)
  }, 350)
}

/* ── Explosion ── */
function finish() {
  fading.value = true
  setTimeout(() => emit('done'), 150)
}

function startStopTimer() {
  // Trigger fade ~0.65s into explosion (mid-audio, before it ends)
  const fadeTimer = setTimeout(() => {
    if (!fading.value) finish()
  }, 650)

  cleanupFns.push(() => clearTimeout(fadeTimer))
}

function showExplosion() {
  loadingAreaHidden.value = true
  if (typingTimer) { clearInterval(typingTimer); typingTimer = null }

  setTimeout(() => {
    explosionActive.value = true

    // SCREEN SHAKE
    if (rootEl.value) {
      rootEl.value.classList.add('shake')
      setTimeout(() => rootEl.value!.classList.remove('shake'), 500)
    }

    // Play explosion sound
    explosionSound.currentTime = 0
    explosionSound.play().catch(() => {})

    // Play video
    if (videoEl.value) {
      if (!videoEl.value.src) {
        videoEl.value.src = 'loadingbar/explosion.webm'
      }
      videoEl.value.muted = false
      videoEl.value.volume = 1.0
      videoEl.value.currentTime = 0
      videoEl.value.play().catch(() => {})
    }

    startStopTimer()
  }, 400)
}

/* ── Load sequence ── */
function loadNext() {
  if (placed >= TOTAL_BLOCKS) return
  const isLast = placed === TOTAL_BLOCKS - 1
  addBlock(isLast)
  if (isLast) {
    setTimeout(showExplosion, 900)
    return
  }
  const base = 800 + Math.random() * 800
  const hiccup = Math.random() < 0.2 ? 1000 + Math.random() * 1000 : 0
  const timer = setTimeout(loadNext, base + hiccup)
  cleanupFns.push(() => clearTimeout(timer))
}

/* ── Lifecycle ── */
onMounted(() => {
  // Shuffle & rotate tips (can start immediately — decorative)
  const shuffled = [...tips].sort(() => Math.random() - 0.5)
  let tipIndex = 0
  currentTip.value = shuffled[0]
  const tipInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % shuffled.length
    currentTip.value = shuffled[tipIndex]
  }, 3000)
  cleanupFns.push(() => clearInterval(tipInterval))

  // Wait until the window is painted before starting the block sequence
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Safety timer — 15s max
      totalTimer = setTimeout(() => {
        if (!fading.value) finish()
      }, 15000)

      // Start block sequence
      setTimeout(loadNext, 400)
    })
  })
})

onBeforeUnmount(() => {
  if (typingTimer) clearInterval(typingTimer)
  if (pctInterval) clearInterval(pctInterval)
  if (hoverInterval) clearInterval(hoverInterval)
  if (totalTimer) clearTimeout(totalTimer)
  chickenSound.pause()
  cleanupFns.forEach(fn => fn())
})
</script>

<!-- Unscoped — all styles (original MCPVP + pixel-art loading bar) -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.splash-screen, .splash-screen *, .splash-screen *::before, .splash-screen *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s ease-out;
  background: #0a0a0a;
}

.splash-fadeout {
  opacity: 0;
  pointer-events: none;
}

/* ── Screen shake ── */
.splash-screen.shake {
  animation: screen-shake 0.5s ease-out;
}

@keyframes screen-shake {
  0%   { transform: translate(0, 0); }
  10%  { transform: translate(-6px, 4px); }
  20%  { transform: translate(6px, -4px); }
  30%  { transform: translate(-5px, 3px); }
  40%  { transform: translate(5px, -3px); }
  50%  { transform: translate(-3px, 2px); }
  60%  { transform: translate(3px, -2px); }
  70%  { transform: translate(-2px, 1px); }
  80%  { transform: translate(2px, -1px); }
  100% { transform: translate(0, 0); }
}

/* ── MCPVP Background ── */
.mcpvp-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.mcpvp-bg img.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
  image-rendering: pixelated;
  pointer-events: none;
  display: block;
}

.mcpvp-bg .layer-rear       { z-index: 0; }
.mcpvp-bg .layer-sea        { z-index: 1; }
.mcpvp-bg .layer-foreground { z-index: 2; }

/* ── Ghast animations ── */
@keyframes ghast-drift {
  0%   { transform: translateX(-14vw); }
  100% { transform: translateX(114vw); }
}

@keyframes ghast-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(var(--amp, 14px)); }
}

.ghast-wrap {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  will-change: transform;
}

.ghast-inner {
  animation: ghast-bob var(--bob-dur, 8s) ease-in-out infinite;
}

.ghast-wrap img {
  image-rendering: pixelated;
  display: block;
}

/* ── Overlays ── */
.overlay-gradient {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(0,0,0,0.92) 0%,
    rgba(0,0,0,0.78) 25%,
    rgba(0,0,0,0.5) 55%,
    rgba(0,0,0,0.22) 80%,
    transparent 100%);
}

.overlay-red {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(ellipse 80% 50% at 50% 60%,
    rgba(203,69,64,0.18) 0%,
    rgba(203,69,64,0.14) 30%,
    transparent 70%);
}

.overlay-noise {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  opacity: 0.25;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}

/* ── Bottom shadow fix — seamless edge ── */
.splash-screen::after {
  content: '';
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  z-index: 7;
  pointer-events: none;
  background: linear-gradient(to top, #0a0a0a 0%, transparent 100%);
}

/* ── Center content ── */
.splash-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.splash-center.fade-out {
  opacity: 0;
}

.splash-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 24px rgba(203,69,64,0.4));
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.04); opacity: 0.9; }
}

.splash-title {
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 0 40px rgba(203,69,64,0.3);
}

/* ═══════ PIXEL-ART LOADING BAR ═══════ */

.loading-text {
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  color: #aaa;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 0 rgba(0,0,0,0.5);
  min-height: 16px;
  margin-top: 8px;
}

/* ── Block row ── */
.block-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 48px;
}

.block {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  opacity: 0;
  transform: scale(0) translateY(12px);
  animation: pop-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              filter 0.3s ease,
              box-shadow 0.3s ease;
  position: relative;
}

.block:hover {
  z-index: 10;
}

@keyframes pop-in {
  0%   { opacity: 0; transform: scale(0) translateY(12px); }
  60%  { opacity: 1; transform: scale(1.08) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Block click bounce animation */
.block.clicked {
  animation: bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

@keyframes bounce {
  0%   { transform: scale(1.25) translateY(-8px); }
  30%  { transform: scale(0.8) translateY(8px); }
  60%  { transform: scale(1.3) translateY(-12px); }
  100% { transform: scale(1) translateY(0); }
}

/* Idle glow effects per block type */
.block.glowstone { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, glowstone-glow 2.5s ease-in-out infinite 0.55s; }
@keyframes glowstone-glow {
  0%, 100% { filter: brightness(1.1) drop-shadow(0 0 6px rgba(255,200,60,0.5)); }
  50%      { filter: brightness(1.3) drop-shadow(0 0 14px rgba(255,200,60,0.8)); }
}

.block.diamond { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, diamond-shimmer 2s ease-in-out infinite 0.55s; }
@keyframes diamond-shimmer {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 6px rgba(0,200,255,0.5)); }
  50%      { filter: brightness(1.2) drop-shadow(0 0 14px rgba(0,200,255,0.8)); }
}

.block.redstone { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, redstone-glow 1.8s ease-in-out infinite 0.55s; }
@keyframes redstone-glow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(255,40,20,0.4)); }
  50%      { filter: brightness(1.15) drop-shadow(0 0 12px rgba(255,40,20,0.7)); }
}

.block.jack { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, jack-glow 1.6s ease-in-out infinite 0.55s; }
@keyframes jack-glow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 6px rgba(255,180,30,0.5)); }
  33%      { filter: brightness(0.95) drop-shadow(0 0 4px rgba(255,160,20,0.3)); }
  66%      { filter: brightness(1.25) drop-shadow(0 0 16px rgba(255,200,50,0.8)); }
}

.block.tnt { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, tnt-shake 0.1s ease-in-out infinite 0.55s; }
@keyframes tnt-shake {
  0%, 100% { transform: translate(0,0) scale(1); }
  25%      { transform: translate(-2px, 1px) scale(1.02); }
  50%      { transform: translate(2px, -1px) scale(1.02); }
  75%      { transform: translate(-1px, 2px) scale(1.01); }
}

.block.iron { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, iron-shimmer 2.2s ease-in-out infinite 0.55s; }
@keyframes iron-shimmer {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(200,200,210,0.4)); }
  50%      { filter: brightness(1.2) drop-shadow(0 0 10px rgba(200,200,210,0.7)); }
}

.block.netherite { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, netherite-pulse 2.4s ease-in-out infinite 0.55s; }
@keyframes netherite-pulse {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(80,50,60,0.5)); }
  50%      { filter: brightness(1.15) drop-shadow(0 0 14px rgba(120,70,80,0.8)); }
}

.block.ancient { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, ancient-glow 2s ease-in-out infinite 0.55s; }
@keyframes ancient-glow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(180,60,40,0.4)); }
  50%      { filter: brightness(1.2) drop-shadow(0 0 12px rgba(180,60,40,0.7)); }
}

.block.crafting { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, crafting-warm 1.8s ease-in-out infinite 0.55s; }
@keyframes crafting-warm {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(160,120,60,0.4)); }
  50%      { filter: brightness(1.15) drop-shadow(0 0 10px rgba(160,120,60,0.7)); }
}

.block.emerald { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, emerald-shimmer 2s ease-in-out infinite 0.55s; }
@keyframes emerald-shimmer {
  0%, 100% { filter: brightness(1.35) drop-shadow(0 0 6px rgba(255,220,50,0.5)); }
  50%      { filter: brightness(1.55) drop-shadow(0 0 14px rgba(255,220,50,0.8)); }
}

.block.gold { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, gold-gleam 2.2s ease-in-out infinite 0.55s; }
@keyframes gold-gleam {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 6px rgba(255,215,0,0.5)); }
  50%      { filter: brightness(1.3) drop-shadow(0 0 16px rgba(255,215,0,0.9)); }
}

.block.chicken { animation: pop-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards, chicken-bob 1.2s ease-in-out infinite 0.55s; }
@keyframes chicken-bob {
  0%, 100% { transform: translateY(0) scale(1); filter: brightness(1.1); }
  50%      { transform: translateY(-3px) scale(1.04); filter: brightness(1.2); }
}

/* ── Progress text ── */
.progress-text {
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  color: #666;
  letter-spacing: 0.15em;
}

/* ── Tooltip ── */
.block-tooltip {
  position: fixed;
  padding: 6px 10px;
  background: rgba(20, 20, 40, 0.95);
  color: #ccc;
  font-size: 8px;
  font-family: 'Press Start 2P', cursive;
  border: 2px solid #555;
  border-radius: 2px;
  pointer-events: none;
  z-index: 999;
  opacity: 0;
  transition: opacity 0.15s ease;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(0,0,0,0.8);
}

.block-tooltip.show { opacity: 1; }

/* ═══════ EXPLOSION OVERLAY ═══════ */

.explosion-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.explosion-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.explosion-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ── Bottom-left tip ── */
.splash-tip {
  position: fixed;
  bottom: 24px;
  left: 28px;
  z-index: 10;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.3px;
  max-width: 400px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: tip-fade 3s ease-in-out infinite;
}

.splash-tip-icon {
  color: rgba(203,69,64,0.6);
  font-size: 10px;
  flex-shrink: 0;
}

@keyframes tip-fade {
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.7; }
}

/* ═══════════════════════════════════════
   BOTTOM-RIGHT TOGGLE BUTTON — dawn.gg 9-slice
   ═══════════════════════════════════════ */
.splash-toggle-btn {
  position: absolute;
  bottom: 28px;
  right: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  min-height: 52px;
  padding: 0 28px;
  cursor: pointer;
  image-rendering: pixelated;
  box-sizing: border-box;
  border: 4px solid transparent;
  border-image-slice: 10;
  border-image-width: 4px;
  border-image-repeat: stretch;
  border-image-source: url('@/assets/btn/normal.png');
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.55));
  transition: transform 0.12s ease, filter 0.12s ease;
  z-index: 100;
}

.splash-toggle-btn--hover {
  border-image-source: url('@/assets/btn/hover.png');
  transform: scale(1.05);
  filter:
    drop-shadow(0 3px 0 rgba(0, 0, 0, 0.55))
    drop-shadow(0 0 12px rgba(111, 203, 107, 0.5))
    drop-shadow(0 0 24px rgba(42, 147, 40, 0.25));
}

.splash-toggle-btn--active {
  border-image-source: url('@/assets/btn/active.png');
  transform: scale(0.95);
  filter:
    drop-shadow(0 1px 0 rgba(0, 0, 0, 0.55))
    drop-shadow(0 0 6px rgba(42, 147, 40, 0.5));
}

.splash-toggle-label {
  font-family: 'Press Start 2P', cursive;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* green gradient text like launch button */
  background: linear-gradient(#6fcb6b 40%, #2a9328 40%);
  -webkit-text-fill-color: transparent;
  color: #0000;
  -webkit-background-clip: text;
  background-clip: text;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  white-space: nowrap;
  transition: background 0s;
}

.splash-toggle-btn--hover .splash-toggle-label {
  background: linear-gradient(#8fe08b 40%, #3db83a 40%);
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
