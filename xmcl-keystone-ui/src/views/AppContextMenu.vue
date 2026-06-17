<template>
  <teleport to="body">
    <div
      v-if="shown"
      class="app-context-overlay"
      @click="shown = false"
      @contextmenu.prevent
    >
      <div
        class="app-context-menu"
        :style="menuStyle"
        @click.stop
        @contextmenu.prevent
      >
        <div class="v-list v-list--density-compact">
          <template v-for="(item, index) in items" :key="item.text">
            <div
              class="v-list-item min-w-40 mx-1"
              :class="{ 'v-list-item--active': item.color === 'red' }"
              @click="item.onClick(); shown = false"
            >
              <span v-if="item.icon" class="v-list-item__prepend">
                <v-icon :color="item.color || ''" size="18">{{ item.icon }}</v-icon>
              </span>
              <span class="v-list-item__content">
                <span class="v-list-item-title text-body-2">{{ item.text }}</span>
              </span>
            </div>
            <div v-if="index !== items.length - 1" class="v-divider" />
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, onUnmounted } from 'vue'
import { useContextMenuData } from '../composables/contextMenu'

const { x, y, items, shown } = useContextMenuData()

const menuStyle = computed((): Record<string, string> => {
  const menuX = Math.min(Math.max(x.value, 8), window.innerWidth - 200)
  const menuY = Math.min(Math.max(y.value, 8), window.innerHeight - 300)
  return {
    left: `${menuX}px`,
    top: `${menuY}px`,
    position: 'fixed',
    'z-index': '10000',
  }
})

// Close on Escape
function onKeyup(e: KeyboardEvent) {
  if (e.key === 'Escape') shown.value = false
}
document.addEventListener('keyup', onKeyup, { capture: true })
onUnmounted(() => document.removeEventListener('keyup', onKeyup, { capture: true }))
</script>

<style scoped>
.app-context-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}
.app-context-menu {
  position: fixed;
  min-width: 180px;
  max-width: 280px;
  background: rgba(28, 28, 40, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.app-context-menu .v-list-item {
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.1s ease;
}
.app-context-menu .v-list-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.app-context-menu .v-list-item--active {
  color: #ef4444;
}
.app-context-menu .v-list-item__prepend {
  display: flex;
  align-items: center;
  width: 22px;
  flex-shrink: 0;
}
.app-context-menu .v-list-item__content {
  flex: 1;
}
.app-context-menu .v-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 8px;
}
</style>
