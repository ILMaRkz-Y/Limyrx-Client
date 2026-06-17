<template>
  <div v-if="bannerSrc" class="instance-banner-wrapper">
    <img
      :src="bannerSrc"
      class="instance-banner"
      alt="Instance Banner"
      @error="onError"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const props = defineProps<{
  src?: string
}>()

const fallback = ref(false)
const bannerSrc = computed(() => {
  if (fallback.value) return undefined
  return props.src || undefined
})

function onError() {
  fallback.value = true
}
</script>

<style scoped>
.instance-banner-wrapper {
  width: 100%;
  max-height: 200px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 8px;
}

.instance-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
