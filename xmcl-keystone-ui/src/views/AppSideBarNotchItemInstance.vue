<script lang="ts" setup>
import { kInstance } from '@/composables/instance'
import { useInstanceContextMenuItems } from '@/composables/instanceContextMenu'
import { kInstances } from '@/composables/instances'
import { useInjectSidebarSettings } from '@/composables/sidebarSettings'
import { getInstanceIcon } from '@/util/favicon'
import { injection } from '@/util/inject'
import { useInstanceServerStatus } from '../composables/serverStatus'
import { BuiltinImages } from '../constant'
import AppSideBarNotchItem from './AppSideBarNotchItem.vue'

const props = defineProps<{
  path: string
  inside?: boolean
  direction?: 'top' | 'bottom' | 'left' | 'right'
}>()

const { instances, selectedInstance } = injection(kInstances)
const { pinnedInstances } = useInjectSidebarSettings()

const instance = computed(() => instances.value.find((i) => i.path === props.path))
const isLocked = computed(() => (instance.value as any)?.locked === true)
const isPinned = computed(() => pinnedInstances.value.includes(props.path))
const name = computed(() => {
  if (!instance.value) return ''
  if (instance.value.name) return instance.value.name
  if (instance.value.runtime.minecraft) return `Minecraft ${instance.value.runtime.minecraft}`
  return ''
})
const runtimes = computed(() => {
  const inst = instance.value
  if (!inst) return []
  const iconAndVersion = [] as { icon: string; text: string }[]
  if (inst.runtime.minecraft) iconAndVersion.push({ icon: BuiltinImages.minecraft, text: inst.runtime.minecraft })
  if (inst.runtime.forge) iconAndVersion.push({ icon: BuiltinImages.forge, text: inst.runtime.forge })
  if (inst.runtime.labyMod) iconAndVersion.push({ icon: BuiltinImages.labyMod, text: inst.runtime.labyMod })
  if (inst.runtime.neoForged) iconAndVersion.push({ icon: BuiltinImages.neoForged, text: inst.runtime.neoForged })
  if (inst.runtime.fabricLoader) iconAndVersion.push({ icon: BuiltinImages.fabric, text: inst.runtime.fabricLoader })
  if (inst.runtime.quiltLoader) iconAndVersion.push({ icon: BuiltinImages.quilt, text: inst.runtime.quiltLoader })
  if (inst.runtime.optifine) iconAndVersion.push({ icon: BuiltinImages.optifine, text: inst.runtime.optifine })
  return iconAndVersion
})

const router = useRouter()

const { select } = injection(kInstance)

const { status } = useInstanceServerStatus(instance)
const favicon = computed(() => {
  const inst = instance.value
  if (!inst) return ''
  return getInstanceIcon(inst, inst.server ? status.value : undefined)
})

const getContextMenu = useInstanceContextMenuItems(instance)

const route = useRoute()
const isActive = computed(() => {
  if (props.path !== selectedInstance.value) return false
  return route.matched[0]?.path === '/'
})

const navigate = () => {
  if (router.currentRoute.value.path !== '/mods') {
    router.push('/mods').then(() => {
      select(props.path)
    })
  } else {
    select(props.path)
  }
}

</script>
<template>
  <div class="notch-instance-wrapper">
    <AppSideBarNotchItem
      :image="favicon"
      :tooltip="() => ({ text: name, items: runtimes, direction: props.direction })"
      :active="isActive"
      :context-menu="getContextMenu"
      @click="navigate"
    />
    <!-- Pin indicator -->
    <div
      v-if="isPinned"
      class="pin-badge"
    >
      <v-icon size="x-small" color="white" style="font-size: 8px;">push_pin</v-icon>
    </div>
    <!-- Lock indicator -->
    <div
      v-if="isLocked"
      class="lock-badge"
    >
      <v-icon size="x-small" color="white" style="font-size: 8px;">lock</v-icon>
    </div>
  </div>
</template>

<style scoped>
.notch-instance-wrapper {
  position: relative;
}

.pin-badge {
  position: absolute;
  top: -2px;
  right: -2px;

  width: 18px;
  height: 18px;

  background: linear-gradient(135deg, #eab308, #f59e0b);
  box-shadow: 0 2px 6px rgba(234, 179, 8, 0.35);

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  pointer-events: none;
}

.lock-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;

  width: 18px;
  height: 18px;

  background: linear-gradient(135deg, #f97316, #ef4444);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  pointer-events: none;
}
</style>
