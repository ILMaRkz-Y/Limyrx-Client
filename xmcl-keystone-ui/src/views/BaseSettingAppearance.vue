<template>
  <!-- Banner Section -->
  <v-card variant="outlined" class="mb-4">
    <v-card-item>
      <template #prepend>
        <v-avatar variant="text" size="48" rounded="lg" color="primary">
          <v-icon>panorama</v-icon>
        </v-avatar>
      </template>
      <v-card-title class="text-subtitle-1 pa-0">
        {{ t('instance.banner') }}
      </v-card-title>
      <v-card-subtitle class="pa-0 text-caption">
        {{ t('instance.bannerHint') }}
      </v-card-subtitle>
      <template #append>
        <v-btn
          :disabled="!banner"
          icon
          variant="text"
          density="comfortable"
          @click="clearBanner"
        >
          <v-icon>restart_alt</v-icon>
        </v-btn>
      </template>
    </v-card-item>
    <v-card-text class="pt-0">
      <div
        v-if="banner"
        class="banner-preview mb-3 rounded-lg overflow-hidden"
      >
        <v-img :src="banner" height="120" cover />
      </div>
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          prepend-icon="upload_file"
          @click="pickBannerFile"
        >
          {{ t('instance.selectBanner') }}
        </v-btn>
        <v-dialog max-width="500">
          <template #activator="{ props: dialogProps }">
            <v-btn variant="outlined" v-bind="dialogProps" prepend-icon="link">
              {{ t('instance.bannerUrl') }}
            </v-btn>
          </template>
          <template #default="{ isActive }">
            <v-card :title="t('instance.bannerUrl')">
              <v-card-text>
                <v-text-field
                  v-model="bannerUrlInput"
                  autofocus
                  variant="filled"
                  :label="t('instance.bannerUrlPlaceholder')"
                  @keydown.enter="applyBannerUrl; isActive.value = false"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="outlined" @click="isActive.value = false">
                  {{ t('shared.cancel') }}
                </v-btn>
                <v-btn
                  color="primary"
                  :disabled="!bannerUrlInput"
                  variant="outlined"
                  @click="applyBannerUrl; isActive.value = false"
                >
                  {{ t('shared.ok') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </div>
    </v-card-text>
  </v-card>

  <v-list-item
    :title="t('setting.instanceTheme.name')"
    :subtitle="
      !instanceTheme
        ? t('setting.instanceTheme.description')
        : t('setting.instanceTheme.activeDescription')
    "
    class="items-center justify-center"
  >
    <template #append>
      <v-list-item-action>
        <v-switch :input-value="!!instanceTheme" @change="toggleInstanceTheme" />
      </v-list-item-action>
    </template>
  </v-list-item>
  <AppearanceItems
    v-if="instanceTheme"
    :theme="instanceTheme"
    dense
    :instance-path="instancePath"
    @save="onSave"
  />
</template>
<script lang="ts" setup>
import AppearanceItems from '@/components/AppearanceItems.vue'
import { kInstance } from '@/composables/instance'
import { kInstanceTheme } from '@/composables/instanceTheme'
import { kInstances } from '@/composables/instances'
import { useService } from '@/composables/service'
import { kTheme } from '@/composables/theme'
import { injection } from '@/util/inject'
import { InstanceThemeServiceKey } from '@xmcl/runtime-api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { path: instancePath, instance } = injection(kInstance)
const { instanceTheme, saveTheme, clearTheme } = injection(kInstanceTheme)
const { currentTheme } = injection(kTheme)
const { copyMediaFromGlobal } = useService(InstanceThemeServiceKey)
const { edit: editInstance } = injection(kInstances)

const banner = ref(instance.value.banner || '')

const bannerUrlInput = ref('')

async function pickBannerFile() {
  const result = await windowController.showOpenDialog({
    title: t('instance.selectBanner'),
    filters: [
      {
        name: 'image',
        extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'],
      },
    ],
    properties: ['openFile'],
  })
  if (result.canceled) return
  const filePath = result.filePaths[0]
  if (filePath) {
    banner.value = `http://launcher/media?path=${filePath}`
    await saveBanner()
  }
}

async function applyBannerUrl() {
  if (bannerUrlInput.value) {
    banner.value = bannerUrlInput.value
    bannerUrlInput.value = ''
    await saveBanner()
  }
}

async function clearBanner() {
  banner.value = ''
  await saveBanner()
}

async function saveBanner() {
  await editInstance({
    instancePath: instancePath.value,
    banner: banner.value,
  })
}

async function toggleInstanceTheme(enabled: boolean) {
  if (enabled) {
    const themeCopy = JSON.parse(JSON.stringify(currentTheme.value))
    if (themeCopy.backgroundImage?.url?.startsWith('http://launcher/theme-media/')) {
      try {
        const newMedia = await copyMediaFromGlobal(
          instancePath.value,
          themeCopy.backgroundImage.url,
        )
        themeCopy.backgroundImage = newMedia
      } catch {
        themeCopy.backgroundImage = undefined
      }
    }
    if (themeCopy.font?.url?.startsWith('http://launcher/theme-media/')) {
      try {
        const newMedia = await copyMediaFromGlobal(instancePath.value, themeCopy.font.url)
        themeCopy.font = newMedia
      } catch {
        themeCopy.font = undefined
      }
    }
    if (themeCopy.backgroundMusic?.length > 0) {
      const newMusic = []
      for (const music of themeCopy.backgroundMusic) {
        if (music?.url?.startsWith('http://launcher/theme-media/')) {
          try {
            const newMedia = await copyMediaFromGlobal(instancePath.value, music.url)
            newMusic.push(newMedia)
          } catch {
            // Skip failed copies
          }
        }
      }
      themeCopy.backgroundMusic = newMusic
    }
    instanceTheme.value = themeCopy
    await saveTheme()
  } else {
    await clearTheme()
  }
}

function onSave() {
  saveTheme()
}
</script>
