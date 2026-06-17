<template>
  <div class="files-tab">
    <SettingCard title="Instance Files" icon="folder_open">
      <template #header-action>
        <div class="flex items-center gap-2">
          <v-text-field
            v-model="filterText"
            placeholder="Filter files..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="search"
            class="w-48"
          />
          <v-btn variant="text" icon="refresh" size="small" :loading="loading" @click="refreshFiles" />
        </div>
      </template>
      <div v-if="loading" class="text-center py-8 opacity-50">
        Loading files...
      </div>
      <div v-else-if="filteredFiles.length === 0" class="text-center py-8 opacity-50">
        No files found
      </div>
      <div v-else class="files-table">
        <div class="files-table-header">
          <span class="file-col-name">Name</span>
          <span class="file-col-path">Path</span>
          <span class="file-col-size">Size</span>
          <span class="file-col-actions">Actions</span>
        </div>
        <div
          v-for="file in filteredFiles"
          :key="file.path"
          class="files-table-row"
          :class="{ 'is-dir': file.isDirectory }"
        >
          <span class="file-col-name">
            <v-icon size="16" class="mr-1" :color="file.isDirectory ? '#22c55e' : undefined">
              {{ file.isDirectory ? 'folder' : getFileIcon(file.name) }}
            </v-icon>
            {{ file.name }}
          </span>
          <span class="file-col-path text-xs opacity-50 font-mono">{{ file.path }}</span>
          <span class="file-col-size text-xs opacity-50">{{ file.isDirectory ? '-' : formatSize(file.size) }}</span>
          <span class="file-col-actions">
            <v-btn icon variant="text" size="x-small" @click="openFile(file)" v-shared-tooltip="'Open in Explorer'">
              <v-icon size="14">open_in_new</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="x-small" @click="startRename(file)" v-if="!file.isDirectory" v-shared-tooltip="'Rename'">
              <v-icon size="14">edit</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="x-small" @click="confirmDeleteFile(file)" v-if="!file.isDirectory" v-shared-tooltip="'Delete'">
              <v-icon size="14" color="red">delete</v-icon>
            </v-btn>
          </span>
        </div>
      </div>
    </SettingCard>

    <v-dialog v-model="renameDialog" max-width="400" class="skin-dialog">
      <v-card class="dialog-card pa-6">
        <h3 class="text-lg font-bold mb-4">Rename File</h3>
        <v-text-field v-model="renameNewName" label="New name" variant="outlined" hide-details autofocus />
        <div class="flex gap-3 justify-end mt-4">
          <v-btn variant="text" @click="renameDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="doRename">Rename</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400" class="skin-dialog">
      <v-card class="dialog-card pa-6">
        <h3 class="text-lg font-bold mb-2">Delete File</h3>
        <p class="text-sm opacity-60 mb-6">Are you sure you want to delete "{{ deleteTarget?.name }}"?</p>
        <div class="flex gap-3 justify-end">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { injection } from '@/util/inject'
import { kInstance } from '@/composables/instance'
import { useService } from '@/composables'
import { BaseServiceKey } from '@xmcl/runtime-api'
import SettingCard from '@/components/SettingCard.vue'
import { ref, computed, watch } from 'vue'

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
}

const { path: instancePath } = injection(kInstance)
const { showItemInDirectory } = useService(BaseServiceKey)

const files = ref<FileEntry[]>([])
const loading = ref(false)
const filterText = ref('')

const windowController = (window as any).windowController

const filteredFiles = computed(() => {
  if (!filterText.value) return files.value
  const q = filterText.value.toLowerCase()
  return files.value.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
})

async function refreshFiles() {
  if (!instancePath.value || !windowController) return
  loading.value = true
  try {
    const entries: FileEntry[] = []
    await listDirRecursive(instancePath.value, '', entries)
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.path.localeCompare(b.path)
    })
    files.value = entries
  } catch (e) {
    console.error('Failed to list files', e)
  } finally {
    loading.value = false
  }
}

async function listDirRecursive(basePath: string, relativePath: string, result: FileEntry[]) {
  const dirPath = relativePath ? basePath + '/' + relativePath : basePath
  const entries: Array<{ name: string; isDirectory: boolean; isFile: boolean }> =
    await windowController.readDirectory(dirPath)
  for (const entry of entries) {
    const relPath = relativePath ? relativePath + '/' + entry.name : entry.name
    if (entry.isDirectory) {
      if (entry.name === '.' || entry.name === '..') continue
      result.push({ name: entry.name, path: relPath + '/', isDirectory: true, size: 0 })
      await listDirRecursive(basePath, relPath, result)
    } else if (entry.isFile) {
      result.push({ name: entry.name, path: relPath, isDirectory: false, size: 0 })
    }
  }
}

function getFileIcon(name: string): string {
  if (name.endsWith('.jar')) return 'package'
  if (name.endsWith('.zip') || name.endsWith('.mrpack')) return 'folder_zip'
  if (name.endsWith('.json')) return 'data_object'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.webp')) return 'image'
  if (name.endsWith('.txt') || name.endsWith('.log') || name.endsWith('.cfg') || name.endsWith('.toml')) return 'description'
  return 'insert_drive_file'
}

function formatSize(bytes: number): string {
  if (bytes === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return size.toFixed(1) + ' ' + units[i]
}

function openFile(file: FileEntry) {
  const fullPath = instancePath.value + '/' + file.path
  showItemInDirectory(fullPath)
}

// Rename
const renameDialog = ref(false)
const renameTarget = ref<FileEntry | null>(null)
const renameNewName = ref('')

function startRename(file: FileEntry) {
  renameTarget.value = file
  renameNewName.value = file.name
  renameDialog.value = true
}

async function doRename() {
  if (!renameTarget.value || !renameNewName.value || !windowController) return
  const oldPath = instancePath.value + '/' + renameTarget.value.path
  const newPath = instancePath.value + '/' + renameTarget.value.path.replace(renameTarget.value.name, renameNewName.value)
  try {
    await windowController.renameFile(oldPath, newPath)
    renameDialog.value = false
    await refreshFiles()
  } catch (e) {
    console.error('Rename failed', e)
  }
}

// Delete
const deleteDialog = ref(false)
const deleteTarget = ref<FileEntry | null>(null)

function confirmDeleteFile(file: FileEntry) {
  deleteTarget.value = file
  deleteDialog.value = true
}

async function doDelete() {
  if (!deleteTarget.value || !windowController) return
  const fullPath = instancePath.value + '/' + deleteTarget.value.path
  try {
    await windowController.deleteFile(fullPath)
    deleteDialog.value = false
    await refreshFiles()
  } catch (e) {
    console.error('Delete failed', e)
  }
}

watch(instancePath, () => { refreshFiles() }, { immediate: true })
</script>

<style scoped>
.files-table {
  font-size: 0.85rem;
}
.files-table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 80px 100px;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #2a2a2a;
  font-weight: 600;
  opacity: 0.5;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.files-table-row {
  display: grid;
  grid-template-columns: 1fr 2fr 80px 100px;
  gap: 8px;
  padding: 6px 12px;
  align-items: center;
  border-bottom: 1px solid #1a1a1a;
  transition: background 0.15s;
}
.files-table-row:hover {
  background: rgba(255,255,255,0.03);
}
.files-table-row.is-dir {
  color: #22c55e;
}
.file-col-name {
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-col-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-col-actions {
  display: flex;
  gap: 2px;
}
</style>
