<template>
  <v-dialog v-model="isShown" width="520" scrollable>
    <v-card class="rounded-xl overflow-hidden">
      <v-card-item class="px-6 pt-6 pb-4">
        <template #prepend>
          <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
            <v-icon size="24">dns</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-medium">{{ t('servers.createLocal') }}</v-card-title>
        <v-card-subtitle>{{ t('servers.createLocalHint') }}</v-card-subtitle>
        <template #append>
          <v-btn icon variant="text" density="comfortable" @click="hide">
            <v-icon>close</v-icon>
          </v-btn>
        </template>
      </v-card-item>
      <v-divider />
      <v-card-text class="px-6 py-5 flex flex-col gap-4">
        <v-text-field v-model="name" :label="t('instance.name')" variant="outlined" density="compact" hide-details autofocus />
        <v-select
          v-model="selectedVersion"
          :label="t('minecraftVersion.name')"
          :items="minecraftVersions"
          variant="outlined"
          density="compact"
          hide-details
        />
        <v-select
          v-model="selectedLoader"
          :label="t('mod.loader')"
          :items="loaderOptions"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-card-text>
      <v-divider />
      <div class="flex items-center gap-3 px-6 py-3 justify-end">
        <v-btn variant="text" @click="hide">{{ t('shared.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" rounded="pill" :disabled="!name || !selectedVersion" :loading="creating" @click="onCreate">
          {{ t('create') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useDialog } from '@/composables/dialog'
import { useService } from '@/composables'
import { InstanceServiceKey } from '@xmcl/runtime-api'
import { kInstance } from '@/composables/instance'
import { kLatestMinecraftVersion } from '@/composables/version'
import { useMinecraftVersions } from '@/composables/version'
import { injection } from '@/util/inject'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const { select } = injection(kInstance)
const { release } = injection(kLatestMinecraftVersion)

const { versions: allVersions } = useMinecraftVersions()

const minecraftVersions = computed(() => {
  return allVersions.value
    .filter((v: any) => v.type === 'release')
    .map((v: any) => v.id)
    .reverse()
})

const { isShown, hide } = useDialog('create-local-server')

const name = ref('')
const selectedVersion = ref('')
const selectedLoader = ref('')
const creating = ref(false)
const error = ref('')

watch(isShown, (v) => {
  if (v) {
    name.value = ''
    selectedVersion.value = release.value || minecraftVersions.value[0] || ''
    selectedLoader.value = ''
    error.value = ''
  }
})

const loaderOptions = computed(() => [
  { title: t('forge.name'), value: 'forge' },
  { title: t('fabric.name'), value: 'fabric' },
  { title: t('neoforge.name'), value: 'neoforge' },
  { title: t('quilt.name'), value: 'quilt' },
])

const { createInstance } = useService(InstanceServiceKey)

async function onCreate() {
  if (!name.value || !selectedVersion.value) return
  creating.value = true
  error.value = ''
  try {
    const runtime: any = { minecraft: selectedVersion.value }
    if (selectedLoader.value === 'forge') runtime.forge = ''
    if (selectedLoader.value === 'fabric') runtime.fabricLoader = ''
    if (selectedLoader.value === 'neoforge') runtime.neoForged = ''
    if (selectedLoader.value === 'quilt') runtime.quiltLoader = ''

    const newPath = await createInstance({
      name: name.value,
      runtime,
    })
    select(newPath)
    router.push('/')
    hide()
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    creating.value = false
  }
}
</script>
