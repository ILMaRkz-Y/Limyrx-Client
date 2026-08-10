<template>
  <v-alert
    v-if="show"
    data-testid="home-update-banner"
    class="home-update-banner mx-3 mt-3"
    color="primary"
    variant="tonal"
    border="start"
    density="comfortable"
  >
    <div class="home-update-banner__row">
      <v-icon
        color="primary"
        class="home-update-banner__icon flex-shrink-0"
        size="32"
      >
        rocket_launch
      </v-icon>

      <div class="home-update-banner__content min-w-0 flex-1">
        <div class="home-update-banner__title">
          {{ t('launcherUpdate.banner.title') }}
          <span
            data-testid="home-update-banner-version"
            class="home-update-banner__version"
          >
            {{ currentVersion }} → {{ updateVersion }}
          </span>
        </div>
        <div
          v-if="snippet"
          class="home-update-banner__desc"
        >
          {{ snippet }}
          <button
            data-testid="home-update-banner-whats-new"
            type="button"
            class="home-update-banner__link"
            @click="showDetails"
          >
            {{ t('launcherUpdate.banner.whatsNew') }}
          </button>
        </div>
      </div>

      <div class="home-update-banner__actions flex-shrink-0">
        <v-btn
          data-testid="home-update-banner-discord"
          v-shared-tooltip="() => t('launcherUpdate.banner.discordTooltip')"
          size="small"
          variant="text"
          @click="openDiscord"
        >
          <v-icon
            start
            size="small"
          >
            forum
          </v-icon>
          Discord
        </v-btn>

        <v-btn
          v-if="updateStatus === 'pending'"
          data-testid="home-update-banner-update"
          color="primary"
          size="small"
          :loading="downloading"
          @click="download"
        >
          <v-icon
            start
            size="small"
          >
            cloud_download
          </v-icon>
          {{ t('launcherUpdate.banner.updateNow') }}
        </v-btn>
        <v-btn
          v-else-if="updateStatus === 'ready'"
          data-testid="home-update-banner-update"
          color="primary"
          size="small"
          :loading="installing"
          @click="install"
        >
          <v-icon
            start
            size="small"
          >
            refresh
          </v-icon>
          {{ t('launcherUpdate.installAndQuit') }}
        </v-btn>

        <v-btn
          data-testid="home-update-banner-dismiss"
          icon
          size="small"
          variant="text"
          :aria-label="t('launcherUpdate.banner.dismiss')"
          @click="dismiss"
        >
          <v-icon size="small">close</v-icon>
        </v-btn>
      </div>
    </div>
  </v-alert>
</template>

<script lang="ts" setup>
import { useDialog } from '@/composables/dialog'
import { kEnvironment } from '@/composables/environment'
import { useService } from '@/composables/service'
import { kSettingsState } from '@/composables/setting'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { injection } from '@/util/inject'
import { BaseServiceKey } from '@xmcl/runtime-api'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const DISCORD_URL = 'https://discord.gg/BFtrhsw3R2'

/** Per-version dismissal key so the banner reappears for the next release. */
const dismissalKey = (versionName: string) => `limyrx-update-banner-dismissed-${versionName}`

const normalizeVersion = (v: string) => (v.startsWith('v') ? v : `v${v}`)

const { state } = injection(kSettingsState)
const env = injection(kEnvironment)
const { checkUpdate, downloadUpdate, quitAndInstall } = useService(BaseServiceKey)
const { show: showDetails } = useDialog('update-info')

const updateInfo = computed(() => state.value?.updateInfo)
const updateStatus = computed(() => state.value?.updateStatus ?? 'none')
const { t } = useI18n()
const currentVersion = computed(() => normalizeVersion(env.value?.version ?? '0.0.0'))
const updateVersion = computed(() => (updateInfo.value ? normalizeVersion(updateInfo.value.name) : ''))
const downloading = ref(false)
const installing = ref(false)
const dismissed = ref(false)

/**
 * A short plain-text teaser of the release notes. Keeps the banner compact —
 * the full changelog lives in the update-info dialog.
 */
const snippet = computed(() => {
  const body = updateInfo.value?.body ?? ''
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text
})

const show = computed(() => {
  const info = updateInfo.value
  if (!info?.newUpdate) return false
  if (updateStatus.value !== 'pending' && updateStatus.value !== 'ready') return false
  if (dismissed.value || localStorage.getItem(dismissalKey(info.name)) === '1') return false
  return true
})

onMounted(() => {
  // The startup check may have failed or never run (e.g. no network yet).
  // A fresh check keeps the banner truthful for this session.
  if (!updateInfo.value && updateStatus.value === 'none') {
    checkUpdate().catch(() => {})
  }
})

async function download() {
  downloading.value = true
  try {
    await downloadUpdate()
  } finally {
    downloading.value = false
  }
}

async function install() {
  installing.value = true
  try {
    await quitAndInstall()
  } finally {
    installing.value = false
  }
}

function openDiscord() {
  window.open(DISCORD_URL, 'browser')
}

function dismiss() {
  const name = updateInfo.value?.name
  if (name) {
    localStorage.setItem(dismissalKey(name), '1')
  }
  dismissed.value = true
}
</script>

<style scoped>
.home-update-banner {
  border-radius: 12px;
}

.home-update-banner__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.home-update-banner__icon {
  margin-block: 0;
}

.home-update-banner__content {
  min-width: 0;
}

.home-update-banner__title {
  font-weight: 600;
  line-height: 1.3;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}

.home-update-banner__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: rgb(var(--v-theme-primary));
}

.home-update-banner__desc {
  margin-top: 2px;
  font-size: 0.85rem;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-update-banner__link {
  margin-left: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: inherit;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
}

.home-update-banner__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-inline-start: auto;
}
</style>
