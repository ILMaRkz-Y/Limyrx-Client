<template>
  <v-dialog v-model="isShown" width="460" scrollable>
    <v-card class="rounded-xl overflow-hidden">
      <v-card-item class="px-6 pt-6 pb-4">
        <template #prepend>
          <v-avatar color="warning" variant="tonal" size="44" rounded="lg">
            <v-icon size="24">language</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-medium">{{ t('servers.addExternal') }}</v-card-title>
        <v-card-subtitle>{{ t('servers.addExternalHint') }}</v-card-subtitle>
        <template #append>
          <v-btn icon variant="text" density="comfortable" @click="hide">
            <v-icon>close</v-icon>
          </v-btn>
        </template>
      </v-card-item>
      <v-divider />
      <v-card-text class="px-6 py-5 flex flex-col gap-4">
        <v-text-field v-model="name" :label="t('instance.name')" variant="outlined" density="compact" hide-details autofocus />
        <v-text-field v-model="address" :label="t('server.host')" variant="outlined" density="compact" hide-details :hint="t('server.hostHint')" persistent-hint @keydown.enter="onAdd" />
      </v-card-text>
      <v-divider />
      <div class="flex items-center gap-3 px-6 py-3 justify-end">
        <v-btn variant="text" @click="hide">{{ t('shared.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" rounded="pill" :disabled="!name || !address" @click="onAdd">
          {{ t('create') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useDialog } from '@/composables/dialog'

const emit = defineEmits<{
  (e: 'add-server', entry: { id: string; name: string; host: string; port: number }): void
}>()

const { t } = useI18n()
const { isShown, hide } = useDialog('servers-add-external')

const name = ref('')
const address = ref('')

watch(isShown, (v) => {
  if (v) {
    name.value = ''
    address.value = ''
  }
})

function onAdd() {
  if (!name.value || !address.value) return
  let host = address.value
  let port = 25565
  const colonIdx = host.lastIndexOf(':')
  if (colonIdx > 0) {
    const parsed = parseInt(host.slice(colonIdx + 1), 10)
    if (!isNaN(parsed)) {
      port = parsed
      host = host.slice(0, colonIdx)
    }
  }
  emit('add-server', {
    id: `${host}:${port}-${Date.now()}`,
    name: name.value,
    host,
    port,
  })
  hide()
}
</script>
