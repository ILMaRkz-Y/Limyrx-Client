<template>
  <div class="mods-tab">
    <SettingCard title="Installed Mods" icon="extension">
      <template #header-action>
        <div class="flex items-center gap-2">
          <v-text-field
            v-model="filterText"
            placeholder="Filter mods..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="search"
            class="w-48"
          />
          <v-btn variant="outlined" size="small" prepend-icon="upload_file" @click="uploadMod">
            Upload
          </v-btn>
          <v-btn variant="outlined" size="small" prepend-icon="search" @click="openModrinthSearch">
            Modrinth
          </v-btn>
          <span class="text-xs opacity-50">{{ enabledCount }} / {{ mods.length }} enabled</span>
        </div>
      </template>
      <div v-if="installing" class="text-center py-8 opacity-50">
        Installing mod{{ installingFiles > 1 ? 's' : '' }}...
      </div>
      <div v-else-if="mods.length === 0" class="text-center py-8 opacity-50">
        No mods installed
      </div>
      <div v-else class="mods-list">
        <div
          v-for="instMod in filteredMods"
          :key="instMod.path"
          class="mod-item"
          :class="{ 'mod-disabled': !instMod.enabled }"
        >
          <div class="mod-icon">
            <img v-if="instMod.icon" :src="instMod.icon" alt="" class="mod-avatar" />
            <v-icon v-else size="24" class="opacity-30">extension</v-icon>
          </div>
          <div class="mod-info" @click="showModInfo(instMod)">
            <span class="mod-name">{{ instMod.name || instMod.fileName }}</span>
            <span class="mod-meta text-xs opacity-50">
              {{ instMod.enabled ? 'Enabled' : 'Disabled' }}
              <template v-if="instMod.version"> &middot; {{ instMod.version }}</template>
              <template v-if="instMod.modLoaders && instMod.modLoaders.length"> &middot; {{ instMod.modLoaders.join(', ') }}</template>
            </span>
          </div>
          <v-switch
            :model-value="instMod.enabled"
            color="#22c55e"
            hide-details
            density="compact"
            @click.stop
            @update:model-value="toggleMod(instMod)"
          />
        </div>
      </div>
    </SettingCard>

    <v-dialog v-model="modInfoDialog" max-width="520" class="skin-dialog">
      <v-card v-if="selectedMod" class="dialog-card pa-6">
        <div class="flex items-start gap-4 mb-4">
          <img v-if="selectedMod.icon" :src="selectedMod.icon" alt="" class="w-12 h-12 rounded-lg" />
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold">{{ selectedMod.name || selectedMod.fileName }}</h3>
            <p v-if="selectedMod.version" class="text-xs opacity-50">v{{ selectedMod.version }}</p>
          </div>
          <v-btn icon variant="text" size="small" @click="modInfoDialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </div>

        <div v-if="modrinthProject" class="modrinth-info">
          <p class="text-sm opacity-70 mb-3">{{ modrinthProject.description }}</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <v-chip v-for="cat in modrinthProject.categories" :key="cat" size="x-small" variant="outlined">
              {{ cat }}
            </v-chip>
          </div>
          <div class="flex gap-3 text-sm">
            <span class="opacity-50">Downloads: <strong>{{ modrinthProject.downloads?.toLocaleString() }}</strong></span>
            <span class="opacity-50">Follows: <strong>{{ modrinthProject.followers?.toLocaleString() }}</strong></span>
          </div>
          <v-btn
            v-if="modrinthProject"
            variant="outlined"
            size="small"
            class="mt-3"
            :href="'https://modrinth.com/mod/' + modrinthProject.slug"
            target="_blank"
          >
            <v-icon start size="14">open_in_new</v-icon>
            View on Modrinth
          </v-btn>
        </div>
        <div v-else-if="loadingModrinth" class="text-center py-4 opacity-50">
          Loading Modrinth info...
        </div>
        <div v-else class="text-center py-4 opacity-30">
          <p>No Modrinth project data available</p>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="searchDialog" max-width="640" class="skin-dialog">
      <v-card class="dialog-card pa-6">
        <div class="flex items-center gap-3 mb-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search mods on Modrinth..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="search"
            class="flex-1"
            @keydown.enter="doSearch"
          />
          <v-btn color="primary" variant="flat" :loading="searching" @click="doSearch">
            Search
          </v-btn>
          <v-btn icon variant="text" size="small" @click="searchDialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </div>

        <div v-if="searching" class="text-center py-8 opacity-50">
          Searching Modrinth...
        </div>
        <div v-else-if="searchResults.length === 0 && searchQuery" class="text-center py-8 opacity-50">
          No results found
        </div>
        <div v-else-if="searchResults.length === 0" class="text-center py-8 opacity-30">
          Search for mods to install
        </div>
        <div v-else class="search-results">
          <div
            v-for="hit in searchResults"
            :key="hit.project_id"
            class="search-result-item"
          >
            <img v-if="hit.icon_url" :src="hit.icon_url" alt="" class="search-result-icon" />
            <v-icon v-else size="28" class="search-result-icon-fallback">extension</v-icon>
            <div class="search-result-info">
              <span class="search-result-title">{{ hit.title }}</span>
              <span class="search-result-desc">{{ hit.description }}</span>
              <span class="search-result-meta">
                {{ hit.downloads.toLocaleString() }} downloads
                <template v-if="hit.latest_version"> &middot; {{ hit.latest_version }}</template>
              </span>
            </div>
            <v-btn
              variant="flat"
              color="primary"
              size="small"
              :loading="installingModrinthId === hit.project_id"
              @click="installFromHit(hit)"
            >
              Install
            </v-btn>
          </div>
          <div v-if="hasMore" class="text-center pt-3">
            <v-btn variant="text" size="small" :loading="searching" @click="loadMore">
              Load more
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { injection } from '@/util/inject'
import { kInstance } from '@/composables/instance'
import { kInstanceModsContext } from '@/composables/instanceMods'
import { useService } from '@/composables'
import { InstanceModsServiceKey, MarketType } from '@xmcl/runtime-api'
import type { InstallMarketOptionWithInstance } from '@xmcl/runtime-api'
import { clientModrinthV2 } from '@/util/clients'
import SettingCard from '@/components/SettingCard.vue'
import { ref, computed } from 'vue'
import type { ModFile } from '@/util/mod'
import type { SearchResultHit } from '@xmcl/modrinth'

const { path: instancePath } = injection(kInstance)
const { runtime: instanceRuntime } = injection(kInstance)
const { mods, revalidate } = injection(kInstanceModsContext)
const { install, installFromMarket, enable, disable } = useService(InstanceModsServiceKey)

const filterText = ref('')

const enabledCount = computed(() => mods.value.filter(m => m.enabled).length)

const filteredMods = computed(() => {
  if (!filterText.value) return mods.value
  const q = filterText.value.toLowerCase()
  return mods.value.filter(m => (m.name || m.fileName || '').toLowerCase().includes(q))
})

async function toggleMod(mod: ModFile) {
  if (mod.enabled) {
    await disable({ path: mod.path, files: [mod.path] })
  } else {
    await enable({ path: mod.path, files: [mod.path.replace(/\.disabled$/, '')] })
  }
  setTimeout(() => revalidate(), 500)
}

// --- Upload ---

const installing = ref(false)
const installingFiles = ref(0)

async function uploadMod() {
  const windowController = (window as any).windowController
  if (!windowController) return
  const result = await windowController.showOpenDialog({
    title: 'Select mod files',
    filters: [{ name: 'Mods', extensions: ['jar', 'disabled'] }],
    properties: ['openFile', 'multiSelections'],
  })
  if (result.canceled || !result.filePaths.length) return
  installing.value = true
  installingFiles.value = result.filePaths.length
  try {
    await install({ path: instancePath.value, files: result.filePaths })
    await revalidate()
  } catch (e) {
    console.error('Failed to install mods', e)
  } finally {
    installing.value = false
  }
}

// --- Modrinth search/install ---

const searchDialog = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResultHit[]>([])
const searching = ref(false)
const searchOffset = ref(0)
const hasMore = ref(false)
const installingModrinthId = ref('')

function openModrinthSearch() {
  searchQuery.value = ''
  searchResults.value = []
  searchOffset.value = 0
  hasMore.value = false
  searchDialog.value = true
}

async function doSearch() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  searchOffset.value = 0
  try {
    const result = await clientModrinthV2.searchProjects({
      query: searchQuery.value.trim(),
      limit: 20,
      offset: 0,
      index: 'relevance',
      facets: '[["project_type:mod"]]',
    })
    searchResults.value = result.hits
    hasMore.value = result.offset + result.limit < result.total_hits
  } catch (e) {
    console.error('Modrinth search failed', e)
  } finally {
    searching.value = false
  }
}

async function loadMore() {
  if (searching.value) return
  searching.value = true
  searchOffset.value += 20
  try {
    const result = await clientModrinthV2.searchProjects({
      query: searchQuery.value.trim(),
      limit: 20,
      offset: searchOffset.value,
      index: 'relevance',
      facets: '[["project_type:mod"]]',
    })
    searchResults.value.push(...result.hits)
    hasMore.value = result.offset + result.limit < result.total_hits
  } catch (e) {
    console.error('Modrinth load more failed', e)
  } finally {
    searching.value = false
  }
}

function detectLoader(): string[] {
  const rt = instanceRuntime.value
  const loaders: string[] = []
  if (rt.fabricLoader) loaders.push('fabric')
  if (rt.forge) loaders.push('forge')
  if (rt.quiltLoader) loaders.push('quilt')
  if (rt.neoForged) loaders.push('neoforge')
  return loaders
}

async function installFromHit(hit: SearchResultHit) {
  installingModrinthId.value = hit.project_id
  try {
    const project = await clientModrinthV2.getProject(hit.project_id)
    const gameVersion = instanceRuntime.value.minecraft
    const loaders = detectLoader()
    const versions = await clientModrinthV2.getProjectVersions(hit.project_id, {
      gameVersions: gameVersion ? [gameVersion] : undefined,
      loaders: loaders.length > 0 ? loaders : undefined,
    })
    if (versions.length === 0) {
      console.warn('No matching version found for', hit.title)
      return
    }
    const version = versions[0]
    const options: InstallMarketOptionWithInstance = {
      market: MarketType.Modrinth,
      version: { versionId: version.id, icon: project.icon_url },
      instancePath: instancePath.value,
    }
    await installFromMarket(options)
    await revalidate()
  } catch (e) {
    console.error('Failed to install from Modrinth', e)
  } finally {
    installingModrinthId.value = ''
  }
}

// --- Mod info dialog ---

const modInfoDialog = ref(false)
const selectedMod = ref<ModFile | null>(null)
const modrinthProject = ref<any>(null)
const loadingModrinth = ref(false)

async function showModInfo(mod: ModFile) {
  selectedMod.value = mod
  modrinthProject.value = null
  modInfoDialog.value = true

  if (mod.modrinth?.projectId) {
    loadingModrinth.value = true
    try {
      modrinthProject.value = await clientModrinthV2.getProject(mod.modrinth.projectId)
    } catch (e) {
      console.error('Failed to fetch Modrinth project', e)
    } finally {
      loadingModrinth.value = false
    }
  } else {
    loadingModrinth.value = false
  }
}
</script>

<style scoped>
.mods-list {
  display: flex;
  flex-direction: column;
}
.mod-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #1a1a1a;
  transition: background 0.15s;
}
.mod-item:hover {
  background: rgba(255,255,255,0.03);
}
.mod-disabled {
  opacity: 0.45;
}
.mod-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mod-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}
.mod-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.mod-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mod-meta {
  display: block;
  margin-top: 1px;
}
.modrinth-info {
  border-top: 1px solid #2a2a2a;
  padding-top: 12px;
}
.search-results {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}
.search-result-item:hover {
  background: rgba(255,255,255,0.04);
}
.search-result-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.search-result-icon-fallback {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.3;
}
.search-result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.search-result-title {
  font-size: 0.85rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-result-desc {
  font-size: 0.75rem;
  opacity: 0.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-result-meta {
  font-size: 0.7rem;
  opacity: 0.4;
  margin-top: 1px;
}
</style>
