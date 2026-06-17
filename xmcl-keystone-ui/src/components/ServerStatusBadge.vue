<template>
  <v-chip
    v-if="status && status.ping > 0"
    size="x-small"
    label
    color="success"
    variant="tonal"
  >
    <v-icon start size="10">check_circle</v-icon>
    <span class="text-xs">{{ status.ping }}ms</span>
  </v-chip>
  <v-chip
    v-else-if="status && status.ping === -1"
    size="x-small"
    label
    color="error"
    variant="tonal"
  >
    <v-icon start size="10">error</v-icon>
    {{ typeof status.description === 'string' ? t(status.description) : t('serverStatus.refuse') }}
  </v-chip>
  <v-chip
    v-else
    size="x-small"
    label
    variant="tonal"
  >
    <v-icon start size="10">hourglass_empty</v-icon>
    {{ t('serverStatus.ping') }}
  </v-chip>
</template>

<script lang="ts" setup>
import type { ServerStatus } from '@xmcl/runtime-api'

defineProps<{
  status?: ServerStatus
}>()

const { t } = useI18n()
</script>
