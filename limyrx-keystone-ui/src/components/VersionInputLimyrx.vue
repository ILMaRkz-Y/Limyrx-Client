<script lang="ts" setup>
import { useLimyrxClient } from '@/composables/version'
import { useI18n } from 'vue-i18n'
import VersionInput, { VersionItem } from './VersionInput.vue'
import { BuiltinImages } from '../constant'

const props = defineProps<{
  value?: string
}>()

const { data, isValidating, error, mutate } = useLimyrxClient()
const { t } = useI18n()

const items = computed(() => {
  const manifest = data.value
  if (!manifest) return []
  return Object.keys(manifest.versions).map(name => markRaw({ name }))
})

const emit = defineEmits<{
  (event: 'input', value: string): void
}>()
</script>
<template>
  <VersionInput
    :icon="BuiltinImages.limyrx"
    title="Limyrx Client"
    url="https://client.limyrx.online"
    :placeholder="t('limyrxClient.disable')"
    :value="value"
    :items="items"
    :refreshing="isValidating"
    :is-clearable="true"
    :clear-text="t('limyrxClient.disable')"
    :empty-text="t('limyrxClient.empty')"
    :error="error"
    @input="v => emit('input', v)"
    @refresh="mutate()"
  />
</template>
