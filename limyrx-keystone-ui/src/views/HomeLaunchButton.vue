<template>
  <div
    v-if="!shouldHideLaunchButton"
    v-roving-tabindex
    role="group"
    aria-orientation="horizontal"
    :aria-label="text"
    class="flex flex-grow-0 items-center"
  >
    <v-badge
      :model-value="count !== 0"
      location="top start"
      color="primary"
      :content="count"
    >
      <div
        class="launch-pill"
        :class="{ short: !top }"
      >
        <!-- Main play button with 9-slice dawn.gg border -->
        <button
          id="launch-button"
          data-testid="launch-button"
          type="button"
          class="play-btn"
          :class="{ 'play-btn--active': isPressed }"
          :disabled="isValidating"
          :aria-label="text"
          @click="onPlayClick"
          @mousedown="isPressed = true"
          @mouseup="isPressed = false"
          @mouseleave="isPressed = false; isSettingsHover = false"
          @mouseenter="onHoverEnter"
        >
          <span class="play-btn-content">
            <!-- Pixelated play icon -->
            <span class="play-btn-icon">
              <v-progress-circular
                v-if="loading"
                indeterminate
                :size="20"
                :width="2"
                class="loading-spinner"
              />
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 14 16"
                shape-rendering="crispEdges"
                class="play-svg"
                :class="{ spin: isSpinning }"
                @animationend="isSpinning = false"
              >
                <rect x="2"  y="2"  width="2" height="2"/>
                <rect x="2"  y="4"  width="2" height="2"/>
                <rect x="2"  y="6"  width="2" height="2"/>
                <rect x="2"  y="8"  width="2" height="2"/>
                <rect x="2"  y="10" width="2" height="2"/>
                <rect x="2"  y="12" width="2" height="2"/>
                <rect x="4"  y="4"  width="2" height="2"/>
                <rect x="4"  y="6"  width="2" height="2"/>
                <rect x="4"  y="8"  width="2" height="2"/>
                <rect x="4"  y="10" width="2" height="2"/>
                <rect x="6"  y="6"  width="2" height="2"/>
                <rect x="6"  y="8"  width="2" height="2"/>
                <rect x="8"  y="4"  width="2" height="2"/>
                <rect x="8"  y="6"  width="2" height="2"/>
                <rect x="8"  y="8"  width="2" height="2"/>
                <rect x="8"  y="10" width="2" height="2"/>
                <rect x="10" y="6"  width="2" height="2"/>
                <rect x="10" y="8"  width="2" height="2"/>
              </svg>
            </span>
            <span class="play-btn-label">{{ text }}</span>

            <!-- Settings gear — inside the button, right side -->
            <v-menu
              v-model="isShown"
              :location="top ? 'top end' : 'bottom end'"
              :open-on-hover="true"
              :open-on-click="false"
              transition="scroll-y-transition"
            >
              <template #activator="{ props: activatorProps }">
                <span
                  data-testid="launch-button-menu"
                  class="settings-btn"
                  :class="{ 'settings-btn--hover': isSettingsHover }"
                  :aria-label="t('baseSetting.title', 2)"
                  :aria-haspopup="'menu'"
                  :aria-expanded="isShown"
                  v-bind="activatorProps"
                  @mouseenter.stop="isSettingsHover = true"
                  @mouseleave.stop="isSettingsHover = false"
                  @click.stop
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    shape-rendering="crispEdges"
                    class="settings-gear"
                    :class="{ spin: isSettingsHover }"
                  >
                    <rect x="6" y="0" width="4" height="2"/>
                    <rect x="6" y="14" width="4" height="2"/>
                    <rect x="0" y="6" width="2" height="4"/>
                    <rect x="14" y="6" width="2" height="4"/>
                    <rect x="2" y="2" width="2" height="2"/>
                    <rect x="12" y="2" width="2" height="2"/>
                    <rect x="2" y="12" width="2" height="2"/>
                    <rect x="12" y="12" width="2" height="2"/>
                    <rect x="4" y="4" width="8" height="8"/>
                    <rect x="6" y="6" width="4" height="4" fill="#1a1a2e"/>
                    <rect x="7" y="7" width="2" height="2" fill="#0a0a14"/>
                  </svg>
                </span>
              </template>
              <HomeLaunchButtonMenuList />
            </v-menu>
          </span>
        </button>
      </div>
    </v-badge>
  </div>
</template>

<script lang="ts" setup>
import { kLaunchButton } from '@/composables/launchButton'
import { injection } from '@/util/inject'
import HomeLaunchButtonMenuList from './HomeLaunchButtonMenuList.vue'
import { kInstances } from '@/composables/instances'
import { vRovingTabindex } from '@/directives/rovingTabindex'
import { kInstance } from '@/composables/instance'
import { useHasMinecraftLicense } from '@/composables/minecraftLicense'
import { isBedrockInstance } from '@xmcl/instance'

import btnNormal from '@/assets/btn/normal.png'
import btnHover from '@/assets/btn/hover.png'
import btnActive from '@/assets/btn/active.png'

defineProps<{ compact?: boolean; top?: boolean }>()

const emit = defineEmits(['mouseenter', 'mouseleave'])
const { isValidating } = injection(kInstances)

const { onClick, color, icon, text, loading, leftIcon, count } = injection(kLaunchButton)
const { t } = useI18n()

const { instance } = injection(kInstance)
const { hasMinecraftLicense } = useHasMinecraftLicense()
const isBedrock = computed(() => isBedrockInstance(instance.value))
const shouldHideLaunchButton = computed(() => isBedrock.value && !hasMinecraftLicense.value)

const isShown = ref(false)
const isSpinning = ref(false)
const isPressed = ref(false)
const isSettingsHover = ref(false)

function onHoverEnter() {
  emit('mouseenter')
}
function onHoverLeave() {
  emit('mouseleave')
}
function onPlayClick() {
  isSpinning.value = true
  const clickSound = new Audio('minecraft_click.mp3')
  clickSound.volume = 0.8
  clickSound.play().catch(() => {})
  onClick()
}
</script>

<style scoped>
@font-face {
  font-family: 'Press Start 2P';
  src: url('@/assets/PressStart2P.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* ═══════════════════════════════════════
   LAUNCH PILL — container for play + settings
   ═══════════════════════════════════════ */
.launch-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* ═══════════════════════════════════════
   PLAY BUTTON — dawn.gg 9-slice style
   ═══════════════════════════════════════ */
.play-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  min-height: 80px;
  padding: 0 40px;
  border: none;
  cursor: pointer;
  color: #fff;
  background: transparent;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  filter: drop-shadow(0 3px 0 rgba(0,0,0,0.55));
  font-family: 'Press Start 2P', cursive;
  outline: none;
}

.play-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 9-slice border — dawn.gg 3-state system */
.play-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 6px solid transparent;
  border-image-slice: 21 fill;
  border-image-width: 21px;
  border-image-repeat: stretch;
  border-image-source: url('@/assets/btn/normal.png');
  image-rendering: pixelated;
  border-radius: 0;
  box-sizing: border-box;
  transition: border-image-source 0s;
}

.play-btn:hover::before {
  border-image-source: url('@/assets/btn/hover.png');
}

.play-btn--active::before {
  border-image-source: url('@/assets/btn/active.png');
}

/* ═══════════════════════════════════════
   CONTENT — perfectly centered
   ═══════════════════════════════════════ */
.play-btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 100%;
  width: 100%;
  padding: 0 36px;
}

/* ═══════════════════════════════════════
   PIXELATED PLAY ICON
   ═══════════════════════════════════════ */
.play-btn-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  image-rendering: pixelated;
}

.play-svg {
  width: 28px;
  height: 28px;
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  fill: #2a9328;
}

.play-btn:hover .play-svg {
  fill: #6fcb6b;
}

.play-btn--active .play-svg {
  fill: #1a6b18;
}

.play-btn .play-svg.spin {
  animation: play-spin 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes play-spin {
  from { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.15); }
  to   { transform: rotate(360deg) scale(1); }
}

.loading-spinner {
  color: #2a9328;
}

/* ═══════════════════════════════════════
   TEXT — dawn.gg mc-text-success
   ═══════════════════════════════════════ */
.play-btn-label {
  font-family: 'Press Start 2P', cursive;
  font-size: 18px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* Default gradient */
  background: linear-gradient(#6fcb6b 40%, #2a9328 40%);
  -webkit-text-fill-color: transparent;
  color: #0000;
  -webkit-background-clip: text;
  background-clip: text;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
  transition: background 0s;
  white-space: nowrap;
}

.play-btn:hover .play-btn-label {
  background: linear-gradient(#8fe08b 40%, #3db83a 40%);
  -webkit-background-clip: text;
  background-clip: text;
}

.play-btn--active .play-btn-label {
  background: linear-gradient(#5aad57 40%, #1a6b18 40%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ═══════════════════════════════════════
   SETTINGS BUTTON — pixelated gear, inside play btn
   ═══════════════════════════════════════ */
.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.4);
  background: transparent;
  outline: none;
  image-rendering: pixelated;
  flex-shrink: 0;
  transition: color 0.2s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-left: 4px;
  border-radius: 0;
}

.settings-btn--hover {
  color: rgba(255,255,255,0.85);
}

.settings-btn:hover {
  transform: scale(1.15);
}

.settings-btn:active {
  transform: scale(0.9);
}

.settings-gear {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  fill: currentColor;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s;
}

.settings-gear.spin {
  animation: gear-spin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes gear-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(90deg); }
}

.settings-btn:hover .settings-gear {
  filter: drop-shadow(0 0 5px rgba(111, 203, 107, 0.6));
}

/* ═══════════════════════════════════════
   SHORT MODE (header bar)
   ═══════════════════════════════════════ */
.launch-pill.short .play-btn {
  height: 52px;
  min-height: 52px;
  padding: 0 28px;
}

.launch-pill.short .play-btn-content {
  gap: 10px;
  padding: 0 24px;
}

.launch-pill.short .play-btn-icon {
  width: 22px;
  height: 22px;
}

.launch-pill.short .play-svg {
  width: 22px;
  height: 22px;
}

.launch-pill.short .play-btn-label {
  font-size: 14px;
}

.launch-pill.short .settings-btn {
  width: 24px;
  height: 24px;
}

.launch-pill.short .settings-gear {
  width: 16px;
  height: 16px;
}

@media (max-width: 850px) {
  .play-btn {
    max-width: 300px;
  }
}
</style>
