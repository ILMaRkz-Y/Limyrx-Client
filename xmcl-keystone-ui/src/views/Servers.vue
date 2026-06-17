<template>
  <div data-testid="servers-page" class="servers-page overflow-y-auto h-full select-none px-6 py-6">
    <div class="max-w-1200 mx-auto w-full flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3 flex-grow">
          <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
            <v-icon size="24">dns</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-xl font-bold text-white">{{ t('servers.title') }}</h1>
            <p class="text-white/50 text-sm">{{ t('servers.subtitle') }}</p>
          </div>
        </div>
        <v-btn color="primary" variant="flat" rounded="pill" prepend-icon="add" @click="showCreateDialog">
          {{ t('servers.createLocal') }}
        </v-btn>
        <v-btn variant="outlined" rounded="pill" prepend-icon="language" @click="showAddDialog">
          {{ t('servers.addExternal') }}
        </v-btn>
        <v-btn variant="text" icon :loading="refreshingAll" @click="refreshAll">
          <v-icon>refresh</v-icon>
        </v-btn>
      </div>

      <!-- Local Servers -->
      <section>
        <div class="flex items-center gap-2 mb-3">
          <v-icon color="primary" size="small">computer</v-icon>
          <h2 class="text-sm font-semibold text-white/70 uppercase tracking-wider">{{ t('servers.localServers') }}</h2>
          <v-chip size="x-small" variant="tonal" label>{{ localItems.length }}</v-chip>
        </div>
        <div v-if="localItems.length === 0" class="empty-state rounded-xl p-8 text-center border-dashed border border-white/10">
          <v-icon size="48" color="white/20" class="mb-3">dns</v-icon>
          <p class="text-white/50 text-sm">{{ t('servers.noLocalServers') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3">
          <div v-for="item in localItems" :key="item.key" class="server-card rounded-xl p-4 flex items-center gap-4">
            <v-avatar size="48" rounded="lg" class="flex-shrink-0">
              <v-img :src="item.favicon" />
            </v-avatar>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-white truncate">{{ item.name }}</span>
                <ServerStatusBadge :status="item.status" />
              </div>
              <div class="flex items-center gap-3 text-xs text-white/50 mt-0.5 flex-wrap">
                <span class="flex items-center gap-1">
                  <v-icon size="12">inventory_2</v-icon>
                  {{ item.version }}
                </span>
                <span v-if="item.status?.ping && item.status.ping > 0" class="flex items-center gap-1">
                  <v-icon size="12">signal_cellular_alt</v-icon>
                  {{ item.status.ping }}ms
                </span>
                <span v-if="item.status?.players" class="flex items-center gap-1">
                  <v-icon size="12">people</v-icon>
                  {{ item.status.players.online }}/{{ item.status.players.max }}
                </span>
              </div>
              <div v-if="item.motd" class="text-xs text-white/40 mt-0.5 truncate max-w-md">{{ item.motd }}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <v-btn variant="tonal" color="primary" size="small" rounded="pill" prepend-icon="play_arrow" @click="launchAsServer(item.instance)">
                {{ t('instance.launchServer') }}
              </v-btn>
              <v-btn icon variant="text" size="small" @click="openInstance(item.instance)">
                <v-icon>open_in_new</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </section>

      <!-- External Servers -->
      <section>
        <div class="flex items-center gap-2 mb-3">
          <v-icon color="warning" size="small">language</v-icon>
          <h2 class="text-sm font-semibold text-white/70 uppercase tracking-wider">{{ t('servers.externalServers') }}</h2>
          <v-chip size="x-small" variant="tonal" label>{{ externalItems.length }}</v-chip>
        </div>
        <div v-if="externalItems.length === 0" class="empty-state rounded-xl p-8 text-center border-dashed border border-white/10">
          <v-icon size="48" color="white/20" class="mb-3">language</v-icon>
          <p class="text-white/50 text-sm">{{ t('servers.noExternalServers') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-3">
          <div v-for="item in externalItems" :key="item.key" class="server-card rounded-xl p-4 flex items-center gap-4">
            <v-avatar size="48" rounded="lg" class="flex-shrink-0">
              <v-img :src="item.favicon || BuiltinImages.unknownServer" />
            </v-avatar>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-white truncate">{{ item.name }}</span>
                <ServerStatusBadge :status="item.status" />
              </div>
              <div class="flex items-center gap-3 text-xs text-white/50 mt-0.5 flex-wrap">
                <span class="flex items-center gap-1">
                  <v-icon size="12">link</v-icon>
                  {{ item.host }}:{{ item.port }}
                </span>
                <span v-if="item.status?.version?.name" class="flex items-center gap-1">
                  <v-icon size="12">tag</v-icon>
                  {{ item.status.version.name }}
                </span>
                <span v-if="item.status?.ping && item.status.ping > 0" class="flex items-center gap-1">
                  <v-icon size="12">signal_cellular_alt</v-icon>
                  {{ item.status.ping }}ms
                </span>
                <span v-if="item.status?.players" class="flex items-center gap-1">
                  <v-icon size="12">people</v-icon>
                  {{ item.status.players.online }}/{{ item.status.players.max }}
                </span>
              </div>
              <div v-if="item.motd" class="text-xs text-white/40 mt-0.5 truncate max-w-md">{{ item.motd }}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <v-btn icon variant="text" size="small" :loading="item.pinging" @click="pingOne(item)">
                <v-icon>refresh</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="removeExternal(item)">
                <v-icon>delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </section>
    </div>

    <AppCreateLocalServerDialog />
    <ServersAddExternalDialog @add-server="onExternalServerAdded" />
  </div>
</template>

<script lang="ts" setup>
import { useDialog } from '@/composables/dialog'
import { kInstances } from '@/composables/instances'
import { injection } from '@/util/inject'
import { getInstanceIcon } from '@/util/favicon'
import { useLocalStorageCache } from '@/composables/cache'
import { BuiltinImages } from '@/constant'
import { useService } from '@/composables'
import { ServerStatusServiceKey } from '@xmcl/runtime-api'
import type { ServerStatus } from '@xmcl/runtime-api'
import { useRouter } from 'vue-router'
import { kInstance } from '@/composables/instance'
import AppCreateLocalServerDialog from './AppCreateLocalServerDialog.vue'
import ServersAddExternalDialog from './ServersAddExternalDialog.vue'
import ServerStatusBadge from '@/components/ServerStatusBadge.vue'

interface ExternalEntry {
  id: string
  name: string
  host: string
  port: number
}

interface ServerListItem {
  key: string
  name: string
  host: string
  port: number
  status?: ServerStatus
  favicon?: string
  version?: string
  motd?: string
  instance?: any
  pinging?: boolean
}

const { t } = useI18n()
const router = useRouter()
const { instances } = injection(kInstances)
const { select } = injection(kInstance)
const { pingServer } = useService(ServerStatusServiceKey)

const serverStatusCache = useLocalStorageCache<Record<string, ServerStatus>>(
  'serverStatusCache',
  () => ({}),
  JSON.stringify,
  JSON.parse,
  { deep: true },
)

const externalServers = useLocalStorageCache<ExternalEntry[]>(
  'externalServers',
  () => [],
  JSON.stringify,
  JSON.parse,
  { deep: true },
)

const refreshingAll = ref(false)

function getMotd(status?: ServerStatus): string {
  if (!status?.description) return ''
  if (typeof status.description === 'string') return status.description
  return ''
}

async function pingHost(host: string, port: number): Promise<ServerStatus> {
  const id = `${host}:${port}`
  try {
    const result = await pingServer({ host, port })
    serverStatusCache.value[id] = result
    return result
  } catch {
    return undefined as any
  }
}

async function pingOne(item: ServerListItem) {
  item.pinging = true
  item.status = await pingHost(item.host, item.port)
  item.pinging = false
}

async function refreshAll() {
  refreshingAll.value = true
  for (const item of externalItems.value) {
    item.status = await pingHost(item.host, item.port)
  }
  refreshingAll.value = false
}

const localItems = computed<ServerListItem[]>(() => {
  return instances.value
    .filter(i => i.server || i.runtime.minecraft)
    .map(i => {
      const sid = i.server ? `${i.server.host}:${i.server.port ?? 25565}` : ''
      const cached = sid ? serverStatusCache.value[sid] : undefined
      const parts: string[] = []
      if (i.runtime.minecraft) parts.push(i.runtime.minecraft)
      if (i.runtime.forge) parts.push(`Forge ${i.runtime.forge}`)
      if (i.runtime.fabricLoader) parts.push(`Fabric ${i.runtime.fabricLoader}`)
      if (i.runtime.neoForged) parts.push(`NeoForge ${i.runtime.neoForged}`)
      if (i.runtime.quiltLoader) parts.push(`Quilt ${i.runtime.quiltLoader}`)

      return {
        key: i.path,
        name: i.name || i.runtime.minecraft || t('server.unknown'),
        host: i.server?.host || '',
        port: i.server?.port ?? 25565,
        status: cached,
        favicon: cached?.favicon || getInstanceIcon(i, cached),
        version: parts.join(' + ') || '?',
        motd: getMotd(cached),
        instance: i,
      }
    })
})

const externalItems = computed<ServerListItem[]>(() => {
  return externalServers.value.map(e => {
    const id = `${e.host}:${e.port}`
    const cached = serverStatusCache.value[id]
    return {
      key: e.id,
      name: e.name,
      host: e.host,
      port: e.port,
      status: cached,
      favicon: cached?.favicon,
      version: cached?.version?.name,
      motd: getMotd(cached),
    }
  })
})

const { show: showCreateDialog } = useDialog('create-local-server')
const { show: showAddDialog } = useDialog('servers-add-external')
const { show: showLaunchServer } = useDialog('launch-server')

function openInstance(inst: any) {
  select(inst.path)
  router.push('/')
}

function launchAsServer(inst: any) {
  select(inst.path)
  showLaunchServer()
}

function removeExternal(item: ServerListItem) {
  const idx = externalServers.value.findIndex(e => e.id === item.key)
  if (idx >= 0) externalServers.value.splice(idx, 1)
}

function onExternalServerAdded(entry: { id: string; name: string; host: string; port: number }) {
  externalServers.value.push(entry)
  pingHost(entry.host, entry.port)
}
</script>

<style scoped>
.servers-page {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.server-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.server-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.empty-state {
  background: rgba(255, 255, 255, 0.02);
}
</style>






