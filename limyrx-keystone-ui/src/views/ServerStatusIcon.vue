<template>
  <div class="ssi-root" ref="rootRef" @mouseenter="onEnter" @mouseleave="onLeave">
    <!-- 9-slice border frame -->
    <div
      class="ssi-frame"
      :class="{ 'ssi-frame--hover': isIconHovered, 'ssi-frame--active': isIconPressed }"
      @mouseenter="isIconHovered = true"
      @mouseleave="isIconHovered = false; isIconPressed = false"
      @mousedown="isIconPressed = true"
      @mouseup="isIconPressed = false"
      @click="onIconClick"
    >
      <img
        v-if="favicon"
        :src="favicon"
        class="ssi-favicon"
        alt=""
      />
      <span v-else class="ssi-fallback">{{ label.charAt(0).toUpperCase() }}</span>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <transition name="ssi-tip">
        <div
          v-if="show"
          class="ssi-tooltip"
          :style="tooltipPos"
          @mouseenter="onEnter"
          @mouseleave="onLeave"
        >
          <!-- Header row -->
          <div class="ssi-tip-header">
            <span class="ssi-tip-name">{{ label }}</span>
            <span class="ssi-tip-version">{{ status?.version?.name || '' }}</span>
          </div>

          <!-- IP row -->
          <div class="ssi-tip-row">
            <span class="ssi-tip-ip">{{ host }}<template v-if="port !== 25565">:{{ port }}</template></span>
            <button class="ssi-copy-btn" @click.stop="copyIP" :title="copied ? 'Copied!' : 'Copy IP'">
              <svg v-if="!copied" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5"/>
                <path d="M5 11H3.5A1.5 1.5 0 0 1 2 9.5v-7A1.5 1.5 0 0 1 3.5 1h7A1.5 1.5 0 0 1 12 2.5V5"/>
              </svg>
              <svg v-else viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8.5l3.5 3.5L13 4"/>
              </svg>
            </button>
          </div>

          <!-- Players row -->
          <div class="ssi-tip-row">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" class="ssi-tip-icon">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
            </svg>
            <span class="ssi-tip-players">{{ formatPlayers }}</span>
          </div>

          <!-- Ping row -->
          <div class="ssi-tip-row">
            <span class="ssi-tip-ping-label">Ping</span>
            <div class="ssi-ping-bars">
              <div
                v-for="i in 5"
                :key="i"
                class="ssi-bar"
                :class="{ 'is-active': i <= pingLevel }"
                :style="{
                  height: (4 + i * 2) + 'px',
                  '--bar-color': barColor(i <= pingLevel),
                }"
              />
              <span class="ssi-ping-ms">{{ pingText }}</span>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useService } from '@/composables'
import { ServerStatusServiceKey } from '@xmcl/runtime-api'

import btnNormal from '@/assets/btn/normal.png'
import btnHover from '@/assets/btn/hover.png'

const props = defineProps<{
  host: string
  label: string
  port?: number
}>()

const { pingServer } = useService(ServerStatusServiceKey)

const show = ref(false)
const isIconHovered = ref(false)
const isIconPressed = ref(false)
const rootRef = ref<HTMLElement>()
const status = ref<any>(null)
const favicon = ref('')
const copied = ref(false)
const tooltipPos = ref<Record<string, string>>({})

let leaveTimer: ReturnType<typeof setTimeout> | null = null
let copyTimer: ReturnType<typeof setTimeout> | null = null

const pingLevel = computed(() => {
  const p = status.value?.ping
  if (!p || p < 0) return 0
  if (p < 50) return 5
  if (p < 100) return 4
  if (p < 150) return 3
  if (p < 250) return 2
  return 1
})

const pingText = computed(() => {
  const p = status.value?.ping
  if (!p || p < 0) return '—'
  return p + 'ms'
})

const formatPlayers = computed(() => {
  const s = status.value?.players
  if (!s) return '… / …'
  return `${(s.online ?? 0).toLocaleString()} / ${(s.max ?? 0).toLocaleString()}`
})

function barColor(active: boolean): string {
  if (!active) return 'rgba(255,255,255,0.08)'
  const level = pingLevel.value
  if (level >= 5) return '#4ade80'
  if (level >= 4) return '#a3e635'
  if (level >= 3) return '#facc15'
  if (level >= 2) return '#fb923c'
  return '#ef4444'
}

async function fetchStatus() {
  try {
    const result = await pingServer({ host: props.host, port: props.port ?? 25565 })
    status.value = result
    if (result.favicon) {
      favicon.value = result.favicon.startsWith('data:')
        ? result.favicon
        : `data:image/png;base64,${result.favicon}`
    }
  } catch (e) {
    status.value = { players: { online: 0, max: 0 }, ping: -1, version: { name: '' } }
  }
}

function positionTooltip() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  tooltipPos.value = {
    position: 'fixed',
    top: (rect.bottom + 8) + 'px',
    left: (rect.left + rect.width / 2) + 'px',
    transform: 'translateX(-50%)',
    zIndex: '99999',
  }
}

function onEnter() {
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
  fetchStatus()
  show.value = true
  nextTick(positionTooltip)
}

function onLeave() {
  leaveTimer = setTimeout(() => { show.value = false }, 120)
}

async function copyIP() {
  const ip = props.port && props.port !== 25565 ? `${props.host}:${props.port}` : props.host
  try {
    await navigator.clipboard.writeText(ip)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = ip
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 1500)
}

function onIconClick() {
  onEnter()
}

onMounted(fetchStatus)
</script>

<style scoped>
.ssi-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
}

/* ═══════════════════════════════════════
   FRAME — dawn.gg 9-slice border wrapper
   ═══════════════════════════════════════ */
.ssi-frame {
  position: relative;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-sizing: border-box;
  image-rendering: pixelated;
  /* default = normal.png */
  border: 4px solid transparent;
  border-image-slice: 10;
  border-image-width: 4px;
  border-image-repeat: stretch;
  border-image-source: url('@/assets/btn/normal.png');
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.5));
  transition: transform 0.12s ease, filter 0.12s ease;
}

.ssi-frame--hover {
  border-image-source: url('@/assets/btn/hover.png');
  transform: scale(1.08);
  filter:
    drop-shadow(0 2px 0 rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 10px rgba(111, 203, 107, 0.5))
    drop-shadow(0 0 20px rgba(42, 147, 40, 0.25));
}

.ssi-frame--active {
  border-image-source: url('@/assets/btn/active.png');
  transform: scale(0.95);
  filter:
    drop-shadow(0 1px 0 rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 6px rgba(42, 147, 40, 0.5));
}

/* ═══════════════════════════════════════
   FAVICON / FALLBACK
   ═══════════════════════════════════════ */
.ssi-favicon {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  object-fit: cover;
}

.ssi-fallback {
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: #c4b5fd;
  user-select: none;
}
</style>

<style>
/* ── Tooltip (unscoped — teleported to body) ── */
.ssi-tooltip {
  background: rgba(10, 8, 20, 0.95);
  border: 1px solid rgba(109, 40, 217, 0.45);
  border-radius: 10px;
  padding: 10px 13px;
  min-width: 200px;
  max-width: 280px;
  backdrop-filter: blur(16px);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.55),
    0 0 16px rgba(109, 40, 217, 0.1);
  pointer-events: auto;
}

.ssi-tip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ssi-tip-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #e0d5ff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ssi-tip-version {
  font-family: monospace;
  font-size: 10px;
  color: rgba(167, 139, 250, 0.4);
}

.ssi-tip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.ssi-tip-icon {
  flex-shrink: 0;
  opacity: 0.5;
}

.ssi-tip-ip {
  font-family: monospace;
  font-size: 11px;
  color: rgba(196, 181, 253, 0.7);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ssi-copy-btn {
  flex-shrink: 0;
  background: rgba(109, 40, 217, 0.2);
  border: 1px solid rgba(109, 40, 217, 0.3);
  border-radius: 4px;
  padding: 3px 5px;
  cursor: pointer;
  color: rgba(167, 139, 250, 0.6);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ssi-copy-btn:hover {
  background: rgba(109, 40, 217, 0.4);
  color: #c4b5fd;
}

.ssi-tip-players {
  font-family: monospace;
  font-size: 11px;
  color: rgba(196, 181, 253, 0.8);
}

.ssi-tip-ping-label {
  font-family: monospace;
  font-size: 10px;
  color: rgba(167, 139, 250, 0.45);
  flex-shrink: 0;
  width: 28px;
}

/* ── Minecraft-style ping bars ── */
.ssi-ping-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex: 1;
}

.ssi-bar {
  width: 4px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}

.ssi-bar.is-active {
  background: var(--bar-color);
}

.ssi-ping-ms {
  font-family: monospace;
  font-size: 10px;
  color: rgba(167, 139, 250, 0.5);
  margin-left: 6px;
}

/* ── Tooltip transition ── */
.ssi-tip-enter-active { transition: all 0.15s cubic-bezier(0.22, 1, 0.36, 1); }
.ssi-tip-leave-active { transition: all 0.1s ease; }
.ssi-tip-enter-from { opacity: 0; transform: translateX(-50%) translateY(-3px) scale(0.97); }
.ssi-tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(-1px) scale(0.98); }
</style>
