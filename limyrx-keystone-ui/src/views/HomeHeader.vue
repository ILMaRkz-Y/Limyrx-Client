<template>
  <div
    class="header sticky max-w-full select-all transition-all"
    :style="{
      '--app-bar-blur': blurAppBar + 'px',
    }"
    :class="{
      compact,
    }"
    @transitionstart="onTransitionStart"
    @transitionend="onTransitionEnd"
    @transitioncancel="onTransitionEnd"
    @wheel.stop
  >
    <div
      class="header-content flex flex-col"
      style="margin: auto"
      :style="{
        opacity: dragover ? 0 : '',
      }"
    >
      <!-- Top row: instance name + actions -->
      <div
        class="align-center flex max-h-20 flex-1 flex-grow-0 items-baseline pl-6 pr-2 gap-1"
      >
        <span
          :style="{
            fontSize: headerFontSize
          }"
          class="home-title overflow-hidden overflow-ellipsis whitespace-nowrap transition-all"
        >{{ name || `Minecraft ${version.minecraft}` }}</span>
        <router-view name="route" />
        <div class="flex-grow" />
        <router-view name="actions" v-slot="{ Component }">
          <transition
            name="slide-x-transition"
            mode="out-in"
          >
            <component :is="Component" class="flex-shrink-0" />
          </transition>
        </router-view>
      </div>

      <!-- Info strip: version items in a compact chip row -->
      <div v-if="items.length > 0" class="info-strip px-6 pb-1">
        <span
          v-for="item in items"
          :key="item.title"
          class="info-chip"
        >
          <v-avatar v-if="item.avatar" size="14" class="info-chip-icon">
            <v-img :src="item.avatar" />
          </v-avatar>
          <v-icon v-else-if="item.icon" size="14" class="info-chip-icon text-medium-emphasis">{{ item.icon }}</v-icon>
          <span class="info-chip-label">{{ item.title }}</span>
          <span class="info-chip-value">{{ item.text }}</span>
        </span>
      </div>

      <!-- Extensions slot (launch button lives here) -->
      <router-view name="extensions" v-slot="{ Component }">
        <transition
          name="slide-y-reverse-transition"
          mode="out-in"
        >
          <component
            :is="Component"
            class="px-4"
            :class="{
              'mt-5': !compact,
              'mt-3': compact,
            }"
          />
        </transition>
      </router-view>
    </div>
    <div
      v-if="dragover"
      class="w-full h-full flex top-0 p-5"
      style="position: absolute;"
      @dragenter="overcount++"
      @dragleave="overcount--"
      @drop="overcount = 0; onDropModpack($event)"
    >
      <Hint
        :text="t('modpack.dropHint')"
        icon="save_alt"
        class="rounded transition-all"
        :class="{
          dragover,
          yellow: overcount > 0,
          'darken-2': overcount > 0,
        }"
        :style="{
          transform: overcount > 0 ? 'scale(1.0125)' : ''
        }"
      />
    </div>
  </div>
</template>

<script lang=ts setup>
import Hint from '@/components/Hint.vue'
import { useDialog } from '@/composables/dialog'
import { kDropHandler } from '@/composables/dropHandler'
import { kInstance } from '@/composables/instance'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'
import { kCompact } from '@/composables/scrollTop'
import { kTheme } from '@/composables/theme'
import { useExtensionItemsGamePlay, useExtensionItemsVersion } from '@/composables/extensionItems'
import { kInstanceVersion } from '@/composables/instanceVersion'
import { injection } from '@/util/inject'

const { name, runtime: version, instance } = injection(kInstance)
const { versionHeader } = injection(kInstanceVersion)
const { blurAppBar } = injection(kTheme)
const { t } = useI18n()

const transitioning = ref(false)
provide('transitioning', transitioning)

const onTransitionStart = (e: TransitionEvent) => {
  if (e.propertyName !== 'transform') return
  transitioning.value = true
}
const onTransitionEnd = (e: TransitionEvent) => {
  if (e.propertyName !== 'transform') return
  transitioning.value = false
}

const compact = injection(kCompact)
const headerFontSize = computed(() => {
  if (compact.value) {
    return '1.8rem'
  }
  if (name.value && name.value.length > 30) {
    return '2rem'
  }
  return '2.425rem'
})

const { dragover } = injection(kDropHandler)
const { show } = useDialog(AddInstanceDialogKey)
const onDropModpack = (e: DragEvent) => {
  e.preventDefault()
  const file = e.dataTransfer?.files.item(0)
  if (file) {
    show({
      format: 'modpack',
      path: file.path,
    })
  }
}

const overcount = ref(0)

// Instance version info — shown in the compact info strip
const versionItems = useExtensionItemsVersion(instance, versionHeader)
const playDataItems = useExtensionItemsGamePlay(instance)
const items = computed(() => [...versionItems.value, ...playDataItems.value])
</script>
<style scoped>
.header {
  padding-top: 2.5rem;
}

/*
 * Glassmorphism header background — frosted glass with smooth fade.
 * The gradient mask creates a smooth transition into page content.
 */
.header::before {
  content: '';
  position: absolute;
  inset: 0;
  bottom: -70px;
  z-index: -1;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  -webkit-mask-image: linear-gradient(black 60%, transparent);
  mask-image: linear-gradient(black 60%, transparent);
}

:root.dark .header::before,
.dark .header::before {
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header.compact::before {
  bottom: -30px;
}

.header.compact {
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}

/* ── Info strip — glass chip row under the instance name ── */
.info-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  line-height: 1;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--md-shape-full);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}

:root.dark .info-chip,
.dark .info-chip {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.08);
}

.info-chip-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.info-chip-label {
  font-weight: 500;
  opacity: 0.7;
}

.info-chip-value {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

</style>
