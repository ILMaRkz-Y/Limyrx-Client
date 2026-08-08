<template>
  <SettingCard
    :title="t('limyrxClient.title')"
    icon="update"
    data-testid="base-setting-limyrx-card"
  >
    <!-- Status line + actions -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div class="flex min-w-0 items-center gap-2">
        <v-icon
          :icon="statusIcon"
          :color="statusColor"
          size="small"
        />
        <span
          data-testid="base-setting-limyrx-status"
          class="truncate text-sm"
          :class="statusClass"
        >{{ statusText }}</span>
      </div>
      <v-spacer />
      <v-btn
        data-testid="base-setting-limyrx-check"
        variant="text"
        size="small"
        :loading="checking"
        :disabled="isUpdating"
        @click="onCheck"
      >
        <v-icon start size="small">refresh</v-icon>
        {{ t('limyrxClient.checkUpdates') }}
      </v-btn>
      <v-btn
        data-testid="base-setting-limyrx-update"
        color="primary"
        variant="flat"
        size="small"
        rounded="pill"
        :loading="isUpdating"
        :disabled="!canUpdate"
        prepend-icon="download"
        @click="onUpdate"
      >
        {{ t('limyrxClient.update') }}
      </v-btn>
    </div>

    <!-- Changed / missing files -->
    <v-expand-transition>
      <div v-if="updateFiles.length > 0" class="mt-2">
        <v-divider class="my-2 opacity-20" />
        <ul
          data-testid="base-setting-limyrx-file-list"
          class="visible-scroll max-h-40 space-y-1 overflow-y-auto pr-1"
        >
          <li
            v-for="f in updateFiles.slice(0, 10)"
            :key="f.path"
            class="flex items-center gap-2 text-caption"
          >
            <v-icon
              size="x-small"
              :color="f.status === 'missing' ? 'error' : 'warning'"
            >
              {{ f.status === 'missing' ? 'remove_circle_outline' : 'sync_alt' }}
            </v-icon>
            <span class="truncate" :title="f.path">{{ f.path }}</span>
          </li>
          <li v-if="extraFileCount > 0" class="opacity-60">
            {{ t('limyrxClient.moreFiles', { count: extraFileCount }) }}
          </li>
        </ul>
      </div>
    </v-expand-transition>
  </SettingCard>
</template>

<script lang="ts" setup>
import SettingCard from '@/components/SettingCard.vue'
import { kInstance } from '@/composables/instance'
import { isLimyrxClientInstance, useLimyrxClientUpdate } from '@/composables/limyrxClient'
import { useNotifier } from '@/composables/notifier'
import { injection } from '@/util/inject'
import { watch } from 'vue'

const { instance } = injection(kInstance)
const { t } = useI18n()
const { notify } = useNotifier()
const { getState, check, update, updating } = useLimyrxClientUpdate()

const isLimyrx = computed(() => isLimyrxClientInstance(instance.value))
const path = computed(() => instance.value?.path ?? '')
const minecraft = computed(() => instance.value?.runtime.limyrx ?? '')

const state = computed(() => (isLimyrx.value && path.value ? getState(path.value) : { status: 'idle' as const }))
const checking = computed(() => state.value.status === 'checking')
const isUpdating = computed(() => updating.value === path.value)
const error = computed(() => (state.value.status === 'error' ? state.value.error : undefined))
const result = computed(() => (state.value.status === 'checked' ? state.value.result : undefined))

const updateFiles = computed(() => result.value?.files.filter((f) => f.status !== 'up-to-date') ?? [])
const extraFileCount = computed(() => Math.max(0, updateFiles.value.length - 10))

const canUpdate = computed(() => !!result.value?.hasUpdate && !isUpdating.value)

const statusText = computed(() => {
  if (checking.value) return t('limyrxClient.checking')
  if (isUpdating.value) return t('limyrxClient.updating')
  if (error.value) return t('limyrxClient.error')
  const r = result.value
  if (!r) return t('limyrxClient.notChecked')
  if (r.hasUpdate) {
    return t('limyrxClient.updatesAvailable', { changed: r.changed, missing: r.missing })
  }
  return t('limyrxClient.upToDate')
})

const statusIcon = computed(() => {
  if (checking.value || isUpdating.value) return 'sync'
  if (error.value) return 'error_outline'
  if (!result.value) return 'info_outline'
  return result.value.hasUpdate ? 'system_update_alt' : 'check_circle'
})

const statusColor = computed(() => {
  if (error.value) return 'error'
  if (!result.value || checking.value || isUpdating.value) return undefined
  return result.value.hasUpdate ? 'warning' : 'success'
})

const statusClass = computed(() => (error.value ? 'text-error' : ''))

async function onCheck() {
  try {
    await check(path.value, minecraft.value)
  } catch (e) {
    notify({ level: 'error', title: t('limyrxClient.checkFailed'), body: `${e}` })
  }
}

async function onUpdate() {
  try {
    const result = await update(path.value, minecraft.value)
    notify({
      level: 'success',
      title: t('limyrxClient.updateTitle'),
      body: t('limyrxClient.updateBody', { count: result.installed, version: minecraft.value }),
    })
  } catch (e) {
    notify({ level: 'error', title: t('limyrxClient.updateFailed'), body: `${e}` })
  }
}

// Auto-check whenever this instance is shown: on mount and on instance switch.
// The check result is cached per path for the session, so switching back and
// forth does not spam the network.
watch(
  [isLimyrx, path, minecraft],
  ([limyrx, p, mc]) => {
    if (!limyrx || !p || !mc) return
    if (getState(p).status === 'idle') {
      check(p, mc).catch(() => { /* error is surfaced through the card state */ })
    }
  },
  { immediate: true },
)
</script>
