<template>
  <canvas
    ref="canvasRef"
    :class="{ 'cursor-grab': rotatable, 'cursor-grabbing': dragging }"
    @mousedown="onPointerDown"
    @mousemove="onPointerMove"
    @mouseup="onPointerUp"
    @mouseleave="onPointerUp"
    @dragover="emit('dragover', $event)"
    @drop="emit('drop', $event)"
  />
</template>

<script lang=ts setup>
import { IdleAnimation, SkinViewer, WalkingAnimation, RunningAnimation } from 'skinview3d'
import defaultSkin from '@/assets/steve_skin.png'

const props = withDefaults(defineProps<{
  width?: number
  height?: number
  cape?: string
  skin?: string
  slim?: boolean
  name?: string
  animation?: 'walking' | 'none' | 'idle' | 'running'
  paused?: boolean
  rotatable?: boolean
  inertia?: boolean
  zoom?: number
  fov?: number
  rotateY?: number
}>(), {
  width: 210,
  height: 400,
  slim: undefined,
  cape: undefined,
  name: 'Steve',
  skin: '',
  animation: 'idle',
  rotatable: false,
  inertia: false,
  zoom: 0.85,
  fov: 45,
  rotateY: -0.5,
})

const canvasRef = ref(null)
const data = {
  disposed: false,
}
const dragging = ref(false)
let dragStartX = 0
let dragStartYaw = 0
let velocityYaw = 0
let inertiaFrame = 0

const animationObject = computed(() => {
  if (props.animation === 'none') {
    return null
  }
  if (props.animation === 'walking') {
    return new WalkingAnimation()
  }
  if (props.animation === 'idle') return new IdleAnimation()
  if (props.animation === 'running') return new RunningAnimation()
  return null
})
onUnmounted(() => {
  data.disposed = true
  if (inertiaFrame) cancelAnimationFrame(inertiaFrame)
  viewer?.dispose()
})

const emit = defineEmits(['model', 'dragover', 'drop'])

let lastCapeLoad = Promise.resolve()

let viewer: SkinViewer

let lastLoad = Promise.resolve()
async function loadSkin() {
  const url = props.skin || defaultSkin
  if (url) {
    try {
      await lastLoad
    } finally {
      lastLoad = viewer.loadSkin(url, { model: typeof props.slim === 'undefined' ? 'auto-detect' : props.slim ? 'slim' : 'default' }).finally(() => {
        emit('model', viewer.playerObject.skin.modelType)
      })
    }
  }
}

function cancelInertia() {
  if (inertiaFrame) {
    cancelAnimationFrame(inertiaFrame)
    inertiaFrame = 0
  }
  velocityYaw = 0
}

function startInertia() {
  const step = () => {
    if (data.disposed) return
    velocityYaw *= 0.95
    if (Math.abs(velocityYaw) < 0.0001) {
      inertiaFrame = 0
      return
    }
    viewer.playerObject.rotation.y += velocityYaw
    inertiaFrame = requestAnimationFrame(step)
  }
  inertiaFrame = requestAnimationFrame(step)
}

function onPointerDown(e: MouseEvent) {
  if (!props.rotatable) return
  cancelInertia()
  dragging.value = true
  dragStartX = e.clientX
  dragStartYaw = viewer.playerObject.rotation.y
  velocityYaw = 0
}

function onPointerMove(e: MouseEvent) {
  if (!dragging.value || !props.rotatable) return
  const dx = e.clientX - dragStartX
  const targetYaw = dragStartYaw + dx * 0.01
  velocityYaw = (targetYaw - viewer.playerObject.rotation.y) * 0.5 + velocityYaw * 0.5
  viewer.playerObject.rotation.y = targetYaw
}

function onPointerUp() {
  dragging.value = false
  if (props.inertia && Math.abs(velocityYaw) > 0.0001) {
    startInertia()
  }
}

onMounted(() => {
  viewer = new SkinViewer({
    canvas: canvasRef.value!,
    width: props.width,
    height: props.height,
    nameTag: props.name,
    fov: props.fov,
    zoom: props.zoom,
  })

  viewer.playerObject.rotation.y = props.rotateY
  viewer.animation = animationObject.value

  loadSkin()
  if (props.cape) {
    lastCapeLoad = viewer.loadCape(props.cape)
  }
})

watch(animationObject, (v) => {
  viewer.animation = v
})

watch(() => props.skin, loadSkin)
watch(() => props.slim, loadSkin)

watch(() => props.cape, (v) => {
  if (v) {
    lastCapeLoad = lastCapeLoad.finally(() => viewer.loadCape(v))
  } else {
    viewer.resetCape()
  }
})

watch(() => props.name, (v) => {
  viewer.nameTag = v || 'Steve'
})

watch(() => props.paused, (paused) => {
  if (paused) {
    viewer.renderPaused = true
  } else {
    viewer.renderPaused = false
  }
})
</script>

<style>
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }
</style>
