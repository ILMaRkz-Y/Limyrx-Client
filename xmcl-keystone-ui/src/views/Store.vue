<template>
  <div
    data-testid="store-page"
    class="store visible-scroll relative flex flex-col items-center overflow-auto"
  >
    <router-view v-slot="{ Component }">
      <Transition
        name="slide-y-transition"
        mode="out-in"
        @after-enter="end"
        @leave="start"
      >
        <component :is="Component" class="flex flex-col" />
      </Transition>
    </router-view>
  </div>
</template>
<script setup lang="ts">
import { useBlockSharedTooltip } from '@/composables/sharedTooltip'
const { start, end } = useBlockSharedTooltip()
</script>

<style>
.store {
  .v-window__container {
    max-height: 360px;
  }
  .v-carousel__controls {
    position: static !important;
  }
}

.store-entry .filter-sidebar {
  background: rgba(20, 20, 40, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.store-entry .source-button {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.store-entry .store-content {
  background: rgba(20, 20, 40, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

</style>
