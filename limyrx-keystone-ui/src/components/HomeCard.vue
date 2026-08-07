<template>
  <v-card
    class="flex h-full flex-col home-card"
    :class="{ highlighted: highlighted }"
    :color="highlighted ? 'yellow darken-2' : cardColor"
    @dragover="emit('dragover', $event)"
    @drop="onDrop"
    @dragenter="dragover += 1"
    @dragleave="dragover -= 1"
    @mouseenter="mouse += 1"
    @mouseleave="mouse -= 1"
  >
    <v-progress-linear
      v-if="refreshing"
      class="absolute left-0 bottom-0 z-20 m-0 p-0"
      indeterminate
    />
    <v-card-item v-if="title">
      <v-card-title>
        <v-icon size="small" start>
          {{ icon }}
        </v-icon>
        {{ title }}
      </v-card-title>
    </v-card-item>
    <v-card-text class="flex-grow relative pb-0">
      <template v-if="refreshing && icons.length === 0">
        <v-skeleton-loader type="paragraph" />
      </template>
      <template v-else-if="slots.default">
        <slot />
      </template>
      <template v-else>
        <span v-if="!error" class="text-content">
          {{ text }}
        </span>
        <span v-else class="color-red">
          <v-icon color="red" size="small"> warning </v-icon>
          {{ error.message || error }}
        </span>
        <div v-if="!globalDragover && icons.length > 0" class="mt-4">
          <v-avatar
            v-for="a of icons"
            :key="a.name"
            v-shared-tooltip="a.name"
            :color="a.color ? a.color : !a.icon ? getColor(a.name) : undefined"
            size="30px"
          >
            <img
              v-if="a.icon"
              :src="a.icon"
              width="30"
              v-fallback-img="BuiltinImages.unknownServer"
              draggable="false"
            />
            <span v-else> {{ a.name[0]?.toUpperCase() }} </span>
          </v-avatar>
        </div>
      </template>
    </v-card-text>
    <v-card-actions class="justify-between" v-if="button || additionButton">
      <v-btn v-if="button" ref="btnElem" :data-testid="button.testid" @click="emit('navigate')" variant="text">
        <v-icon v-if="button.icon" start>
          {{ button.icon }}
        </v-icon>
        <span :style="{ color: isOverflowed ? 'transparent' : '' }">
          {{ button.text }}
        </span>
      </v-btn>
      <v-spacer v-else />
      <v-btn
        v-if="additionButton"
        color="primary"
        :data-testid="additionButton.testid"
        @click="emit('navigate-addition')"
        variant="text"
      >
        <v-icon class="material-icons-outlined" start>
          {{ additionButton.icon || 'add' }}
        </v-icon>
        <span>
          {{ additionButton.text }}
        </span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts" setup>
import { kDropHandler } from '@/composables/dropHandler'
import { kTheme } from '@/composables/theme'
import { BuiltinImages } from '@/constant'
import { vFallbackImg } from '@/directives/fallbackImage'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { getColor } from '@/util/color'
import { injection } from '@/util/inject'
import type { ComponentPublicInstance } from 'vue'

const btnElem = ref(null as ComponentPublicInstance | null)

const isOverflowed = computed(() => {
  const el = btnElem.value?.$el
  if (!el) {
    return
  }

  const isOverflowed = el.scrollWidth > el.clientWidth
  return isOverflowed
})

defineProps<{
  icon?: string
  title?: string
  subtitle?: string
  text: string
  button?: { text: string; icon?: string; testid?: string }
  additionButton?: { text: string; icon?: string; testid?: string }
  refreshing: boolean
  error?: any
  icons: Array<{ name: string; icon?: string; color?: string }>
}>()
const emit = defineEmits([
  'navigate',
  'drop',
  'dragover',
  'dragenter',
  'dragleave',
  'navigate-addition',
])
const { cardColor } = injection(kTheme)

const slots = useSlots()

function onDrop(event: DragEvent) {
  emit('drop', event)
  dragover.value = 0
}

const dragover = ref(0)
const { dragover: globalDragover } = injection(kDropHandler)
const mouse = ref(0)
const highlighted = computed(() => globalDragover.value && dragover.value > 0)
</script>

<style scoped>
.highlighted {
  transform: scale(1.05);
}

.text-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-card {
  container-type: size;
  width: 100%;
  /* Dark glassmorphism — frosted dark with layered highlights */
  background: rgba(0, 0, 0, 0.35) !important;
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border-radius: var(--md-shape-medium) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* Top-edge gradient highlight */
.home-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  z-index: 1;
}

/* Left-edge gradient highlight */
.home-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2),
    transparent,
    rgba(255, 255, 255, 0.08)
  );
  z-index: 1;
}

.home-card:hover {
  border-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
}

/* ── Dark mode (same base, slightly stronger contrast) ── */
:root.dark .home-card,
.dark .home-card {
  background: rgba(0, 0, 0, 0.42) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:root.dark .home-card::before,
.dark .home-card::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.12),
    transparent
  );
}

:root.dark .home-card::after,
.dark .home-card::after {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.12),
    transparent,
    rgba(255, 255, 255, 0.04)
  );
}

:root.dark .home-card:hover,
.dark .home-card:hover {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

/* Lighten text inside dark glass cards */
.home-card :deep(.v-card-title),
.home-card :deep(.v-card-subtitle),
.home-card :deep(.text-content),
.home-card :deep(.v-card-text) {
  color: rgba(255, 255, 255, 0.92) !important;
}

.btn {
  display: none;
}

@container (min-width: 300px) {
  .btn {
    display: block;
  }
}
</style>
