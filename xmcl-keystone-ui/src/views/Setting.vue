<template>
  <div
    data-testid="settings-page"
    class="d-flex fill-height setting-page"
  >
    <div class="theme-bg">
      <div class="tb-blob tb-1" />
      <div class="tb-blob tb-2" />
      <div class="tb-blob tb-3" />
      <div class="tb-blob tb-4" />
      <div class="tb-blob tb-5" />
      <div class="tb-blob tb-6" />
      <div class="tb-spark ts-1" />
      <div class="tb-spark ts-2" />
      <div class="tb-spark ts-3" />
      <div class="tb-spark ts-4" />
      <div class="tb-spark ts-5" />
      <div class="tb-spark ts-6" />
      <div class="tb-spark ts-7" />
    </div>
    <!-- Navigation Sidebar (Only in Wide/Scroll Mode) -->
    <nav v-if="!isNarrowView" class="setting-sidebar pt-6 pl-4 pr-2" :aria-label="t('setting.name', 2)">
      <v-card class="rounded-xl glass-card" elevation="0" color="transparent">
        <v-list nav density="compact" color="transparent" class="rounded-lg" :selected="[activeSectionIndex]" @update:selected="v => activeSectionIndex = (v[0] as number) ?? 0">
          <v-list-subheader class="text-uppercase font-weight-bold grey--text text--darken-1 text-caption pl-4 mb-1">
            {{ t('setting.name') }}
          </v-list-subheader>
          <v-list-item
            v-for="(item, idx) in sections"
            :key="item.id"
            :value="idx"
            class="mb-1 rounded-lg"
            color="primary"
            :title="t(item.title)"
            @click="scrollTo(item.id)"
          >
            <template #prepend>
              <v-icon size="small">{{ item.icon }}</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </nav>

    <!-- Content Area -->
    <div 
      class="flex-grow-1 overflow-y-auto fill-height scroll-container visible-scroll" 
      :class="{ 'has-sticky-tabs': isNarrowView }"
      ref="scrollContainer"
      @scroll="onScroll"
    >
      <!-- Sticky Tabs Header (Only in Narrow/Tabs Mode) -->
      <div v-if="isNarrowView" class="sticky-tabs-wrapper">
        <v-tabs
          v-model="activeSectionIndex"
          align-tabs="center"
          bg-color="transparent"
          color="primary"
          show-arrows
          :aria-label="t('setting.name', 2)"
          class="rounded-lg"
          @update:model-value="onTabChange"
        >
          <v-tab v-for="item in sections" :key="item.id">
            <v-icon start size="small">{{ item.icon }}</v-icon>
            {{ t(item.title) }}
          </v-tab>
        </v-tabs>
      </div>

      <div class="content-wrapper mx-auto pa-4 pa-md-6 glass-content" :class="{ 'tabs-mode': isNarrowView }">
        <!-- All sections rendered vertically in both modes -->
        <section id="general" class="mb-8 scroll-target" role="region" :aria-label="t('setting.general')">
          <SettingHeader
            :title="t('setting.general')"
            icon="settings"
          />
          <SettingGeneral class="mb-4" />
          <SettingAdvanced />
        </section>
        <section id="appearance" class="mb-8 scroll-target" role="region" :aria-label="t('setting.appearance')">
          <SettingHeader
            icon="brush"
            :title="t('setting.appearance')"
            :subtitle="t('setting.appearanceDescription')"
          />
          <SettingGlobalUI />
        </section>
        <section id="global" class="mb-8 scroll-target" role="region" :aria-label="t('setting.globalSetting')">
          <SettingHeader
            :title="'🌍 ' + t('setting.globalSetting')"
            :subtitle="t('setting.globalSettingHint')"
          />
          <SettingGlobal />
        </section>
        <section id="network" class="mb-8 scroll-target" role="region" :aria-label="t('setting.network')">
          <SettingHeader
            :title="t('setting.network')"
            icon="public"
          />
          <SettingNetwork />
        </section>
        <section id="about" class="mb-12 scroll-target" role="region" :aria-label="t('setting.about')">
          <SettingHeader
            :title="t('setting.about')"
            icon="info"
          />
          <SettingUpdate class="mb-4" />
          <SettingAbout />
        </section>
      </div>

      <SettingUpdateInfoDialog />
      <SettingMigrationDialog />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingUpdateInfoDialog from './SettingUpdateInfoDialog.vue'
import SettingUpdate from './SettingUpdate.vue'
import SettingGeneral from './SettingGeneral.vue'
import SettingMigrationDialog from './SettingMigrationDialog.vue'
import SettingGlobal from './SettingGlobal.vue'
import SettingAbout from './SettingAbout.vue'
import SettingNetwork from './SettingNetwork.vue'
import { usePresence } from '@/composables/presence'
import { kUpdateSettings, useUpdateSettings } from '@/composables/setting'
import { injection } from '@/util/inject'
import { kTheme } from '@/composables/theme'
import SettingGlobalUI from './SettingGlobalUI.vue'
import { useMediaQuery } from '@vueuse/core'
import SettingAdvanced from './SettingAdvanced.vue'
import SettingHeader from '@/components/SettingHeader.vue'

const { t } = useI18n()
usePresence(computed(() => t('presence.setting')))

provide(kUpdateSettings, useUpdateSettings())

const { suppressed } = injection(kTheme)

onMounted(() => {
  suppressed.value = true
})
onUnmounted(() => {
  suppressed.value = false
})

const NARROW_BREAKPOINT = 960 // Switch to tabs view when window is narrower than this
const isNarrowView = useMediaQuery(`(max-width: ${NARROW_BREAKPOINT - 1}px)`)

// Navigation Logic
const activeSectionIndex = ref(0)
const scrollContainer = ref<HTMLElement | null>(null)
const isUserScrolling = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

const sections = [
  { id: 'general', title: 'setting.general', icon: 'tune' },
  { id: 'appearance', title: 'setting.appearance', icon: 'palette' },
  { id: 'global', title: 'setting.globalSetting', icon: 'videogame_asset' },
  { id: 'network', title: 'setting.network', icon: 'wifi' },
  { id: 'about', title: 'setting.about', icon: 'info' },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el && scrollContainer.value) {
    isUserScrolling.value = true
    // Account for sticky tabs height in narrow view
    const stickyOffset = isNarrowView.value ? 60 : 20
    const offsetTop = el.offsetTop - stickyOffset
    scrollContainer.value.scrollTo({ top: offsetTop, behavior: 'smooth' })
    
    // Reset user scrolling flag after animation completes
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      isUserScrolling.value = false
    }, 500)
  }
}

function onTabChange(index: number) {
  const section = sections[index]
  if (section) {
    scrollTo(section.id)
  }
}

function onScroll() {
  if (!scrollContainer.value || isUserScrolling.value) return
  
  const container = scrollContainer.value
  // Account for sticky tabs height in narrow view
  const stickyOffset = isNarrowView.value ? 80 : 100
  const scrollTop = container.scrollTop + stickyOffset
  
  for (let i = sections.length - 1; i >= 0; i--) {
    const el = document.getElementById(sections[i].id)
    if (el && el.offsetTop <= scrollTop) {
      activeSectionIndex.value = i
      break
    }
  }
}
</script>

<style scoped>
.setting-page {
  position: relative;
  background: transparent;
}

.setting-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: fit-content;
  max-height: 100vh;
}

.scroll-container {
  scroll-behavior: smooth;
  position: relative;
}

.scroll-container.has-sticky-tabs {
  padding-top: 0;
}

.sticky-tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(8px);
  padding: 8px 0;
  margin-bottom: 16px;
}

.content-wrapper {
  max-width: 80rem;
}

.scroll-target {
  scroll-margin-top: 80px;
}

.glass-card {
  background: rgba(20, 20, 40, 0.6) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-content section {
  background: rgba(20, 20, 40, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
}

.sticky-tabs-wrapper {
  background: rgba(20, 20, 40, 0.7) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px;
  margin: 8px;
}

.theme-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.tb-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(55px);
  animation: tb-drift linear infinite;
  opacity: 0.12;
}

@keyframes tb-drift {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(8px, -6px) scale(1.04); }
  66%  { transform: translate(-5px, 4px) scale(0.97); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.tb-1 {
  width: 220px; height: 220px;
  background: var(--color-primary);
  top: -70px; left: 8%;
  animation-duration: 9s;
}
.tb-2 {
  width: 140px; height: 140px;
  background: var(--color-primary);
  opacity: 0.08;
  top: 30px; left: 55%;
  animation-duration: 12s;
  animation-delay: -3s;
}
.tb-3 {
  width: 170px; height: 170px;
  background: var(--color-primary);
  opacity: 0.1;
  bottom: -50px; left: 22%;
  animation-duration: 14s;
  animation-delay: -6s;
}
.tb-4 {
  width: 110px; height: 110px;
  background: var(--color-primary);
  opacity: 0.08;
  bottom: -20px; right: 28%;
  animation-duration: 10s;
  animation-delay: -2s;
}
.tb-5 {
  width: 90px; height: 90px;
  background: var(--color-primary);
  opacity: 0.06;
  top: 10px; right: 12%;
  animation-duration: 11s;
  animation-delay: -5s;
}
.tb-6 {
  width: 60px; height: 60px;
  background: var(--color-primary);
  opacity: 0.08;
  top: 55px; left: 72%;
  animation-duration: 8s;
  animation-delay: -1s;
}

.tb-spark {
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
  animation: tb-spark-pulse ease-in-out infinite;
}

@keyframes tb-spark-pulse {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.3); }
}

.ts-1 {
  width: 12px; height: 12px;
  background: var(--color-primary);
  top: 18px; left: 23%;
  animation-duration: 3.2s;
}
.ts-2 {
  width: 8px; height: 8px;
  background: var(--color-primary);
  top: 72px; left: 54%;
  animation-duration: 4.1s;
  animation-delay: -1.2s;
}
.ts-3 {
  width: 14px; height: 14px;
  background: var(--color-primary);
  bottom: 14px; left: 71%;
  animation-duration: 2.8s;
  animation-delay: -0.5s;
}
.ts-4 {
  width: 6px; height: 6px;
  background: var(--color-primary);
  top: 30px; right: 18%;
  animation-duration: 3.7s;
  animation-delay: -2s;
}
.ts-5 {
  width: 10px; height: 10px;
  background: var(--color-primary);
  bottom: 20px; left: 45%;
  animation-duration: 5s;
  animation-delay: -3s;
}
.ts-6 {
  width: 5px; height: 5px;
  background: var(--color-primary);
  top: 50px; left: 82%;
  animation-duration: 3s;
  animation-delay: -1s;
}
.ts-7 {
  width: 10px; height: 10px;
  background: var(--color-primary);
  top: 8px; left: 47%;
  animation-duration: 4.5s;
  animation-delay: -2.5s;
}
</style>