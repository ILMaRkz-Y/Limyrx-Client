<template>
  <div class="skin-library">
    <!-- Left: Uploaded Skin Library -->
    <div class="col-library">
      <div class="library-header">
        <h3 class="col-title">My Skins</h3>
        <span class="skin-count">{{ skins.length }} skin{{ skins.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="skin-grid">
        <!-- Upload Skin Card -->
        <div class="add-skin-card" @click="openUploadDialog">
          <v-icon size="28" color="#22c55e">add</v-icon>
          <span class="text-xs font-medium mt-1 opacity-60">Upload PNG</span>
        </div>
        <!-- Skin Cards -->
        <div
          v-for="skin in skins"
          :key="skin.id"
          class="skin-card group"
        >
          <div class="skin-card-img-wrap">
            <img :src="skinPreviews[skin.id] || skin.skinUrl" alt="" class="skin-card-img" />
            <div class="skin-card-overlay">
              <button class="overlay-btn overlay-btn-primary" @click.stop="openApplyDialog(skin)">
                <v-icon size="14">check</v-icon> Apply
              </button>
              <button class="overlay-btn overlay-btn-delete" @click.stop="confirmDelete(skin)">
                <v-icon size="12">delete</v-icon>
              </button>
            </div>
            <div v-if="isSkinApplied(skin)" class="applied-badge">
              <v-icon size="10" color="#22c55e">check_circle</v-icon>
              <span>Active</span>
            </div>
          </div>
          <div class="skin-card-footer">
            <span class="skin-card-name">{{ skin.name }}</span>
            <span class="skin-card-model">{{ skin.model === 'slim' ? 'Slim' : 'Classic' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: 3D Current Player Preview + Capes -->
    <div class="col-preview">
      <div class="preview-header">
        <h3 class="col-title">Current Skin</h3>
        <span v-if="playerName" class="preview-player-name">{{ playerName }}</span>
      </div>
      <div class="preview-3d-view">
        <SkinView
          :key="'player-' + playerKey"
          :skin="realSkinUrl || defaultSkin"
          :slim="realSlim"
          :name="playerName || 'Player'"
          animation="idle"
          :width="320"
          :height="380"
          :zoom="0.8"
          rotatable
          inertia
        />

        <!-- 2D Cape Preview -->
        <div v-if="realCapeUrl && capeRenderUrl" class="cape-2d-section">
          <div class="cape-2d-label">
            <v-icon size="11" color="#22c55e" class="mr-1">checkroom</v-icon>
            Cape
          </div>
          <img :src="capeRenderUrl" alt="Cape" class="cape-2d-img" />
        </div>
      </div>


    </div>

    <!-- Upload Dialog -->
    <v-dialog v-model="uploadDialog" max-width="520" class="skin-dialog" persistent>
      <v-card class="dialog-card pa-6">
        <h3 class="text-lg font-bold text-white mb-4">Upload Skin</h3>

        <div class="upload-layout">
          <!-- Left: 3D Preview -->
          <div class="upload-preview-3d">
            <div class="upload-preview-label">Preview</div>
            <SkinView
              v-if="uploadFileDataUrl"
              :key="'upload-' + uploadPreviewKey"
              :skin="uploadFileDataUrl || defaultSkin"
              :slim="uploadModel === 'slim'"
              :cape="uploadCapeUrl || undefined"
              :name="uploadName || 'Skin'"
              animation="idle"
              :width="180"
              :height="260"
              :zoom="0.9"
              rotatable
              inertia
            />
            <div v-else class="upload-preview-empty">
              <v-icon size="28" color="rgba(255,255,255,0.15)">style</v-icon>
              <span class="text-xs opacity-30 mt-2">Select a file to preview</span>
            </div>
          </div>

          <!-- Right: Form -->
          <div class="upload-form">
            <!-- File drop zone -->
            <div
              class="upload-dropzone"
              :class="{ 'upload-dropzone-filled': uploadFileDataUrl }"
              @click="triggerFilePicker"
            >
              <template v-if="uploadFileDataUrl">
                <img :src="uploadFileDataUrl" alt="" class="upload-thumb" />
                <span class="upload-filename">{{ uploadFileName }}</span>
                <button class="upload-change-btn" @click.stop="triggerFilePicker">Change</button>
              </template>
              <template v-else>
                <v-icon size="24" color="#22c55e">add_photo_alternate</v-icon>
                <span class="text-xs font-medium mt-1 opacity-60">Select PNG</span>
              </template>
            </div>

            <!-- Skin name -->
            <div class="form-group mt-3">
              <label class="form-label">Name</label>
              <input v-model="uploadName" type="text" class="form-input" placeholder="My Skin" />
            </div>

            <!-- Model toggle -->
            <div class="form-group mt-2">
              <label class="form-label">Model</label>
              <div class="model-toggle-group">
                <button
                  class="model-toggle-btn"
                  :class="{ 'model-toggle-active': uploadModel === 'classic' }"
                  @click="uploadModel = 'classic'"
                >
                  <div class="model-toggle-icon">4px</div>
                  <span>Classic</span>
                </button>
                <button
                  class="model-toggle-btn"
                  :class="{ 'model-toggle-active': uploadModel === 'slim' }"
                  @click="uploadModel = 'slim'"
                >
                  <div class="model-toggle-icon model-toggle-icon-slim">3px</div>
                  <span>Slim</span>
                </button>
              </div>
            </div>

            <!-- Cape selector -->
            <div class="form-group mt-2">
              <label class="form-label">
                Cape
                <span class="text-[10px] opacity-40 ml-1">(optional)</span>
              </label>
              <div class="upload-cape-list">
                <button
                  class="upload-cape-opt"
                  :class="{ 'upload-cape-active': !uploadCapeUrl }"
                  @click="uploadCapeUrl = ''"
                >
                  <div class="upload-cape-noimg">
                    <v-icon size="12">close</v-icon>
                  </div>
                  <span class="text-[11px]">None</span>
                </button>
                <button
                  v-for="cape in accountCapes"
                  :key="cape.id"
                  class="upload-cape-opt"
                  :class="{ 'upload-cape-active': uploadCapeUrl === cape.url }"
                  @click="uploadCapeUrl = uploadCapeUrl === cape.url ? '' : cape.url"
                >
                  <div class="upload-cape-thumb">
                    <img :src="cape.url" alt="" class="upload-cape-img" />
                  </div>
                  <span class="text-[11px]">{{ cape.alias || cape.id.slice(0, 8) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-4">
          <v-btn variant="outlined" class="dialog-btn" @click="cancelUpload">Cancel</v-btn>
          <v-btn
            variant="flat"
            color="#22c55e"
            class="dialog-btn text-white font-semibold"
            :disabled="!uploadFileDataUrl || !uploadName.trim()"
            @click="saveUpload"
          >
            Save to Library
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Apply Dialog (skin + cape) -->
    <v-dialog v-model="applyDialog" max-width="420" class="skin-dialog" persistent>
      <v-card class="dialog-card pa-6">
        <h3 class="text-lg font-bold text-white mb-1">Apply Skin</h3>
        <p class="text-sm opacity-50 mb-4">
          Apply "{{ applyTarget?.name }}" to your Minecraft account
        </p>

        <!-- Skin preview -->
        <div class="apply-skin-preview" v-if="applyTarget">
          <img :src="applyTarget.skinUrl" alt="" class="apply-skin-img" />
          <div class="apply-skin-info">
            <span class="apply-skin-name">{{ applyTarget.name }}</span>
            <span class="apply-skin-model">{{ applyTarget.model === 'slim' ? 'Slim' : 'Classic' }}</span>
          </div>
        </div>

        <!-- Cape selector -->
        <div class="form-group mt-4">
          <label class="form-label">
            Cape
            <span class="text-[10px] opacity-40 ml-1">(optional)</span>
          </label>
          <div class="apply-cape-list">
            <button
              class="apply-cape-option"
              :class="{ 'apply-cape-active': applyCapeUrl === '' }"
              @click="applyCapeUrl = ''"
            >
              <div class="apply-cape-noimg">
                <v-icon size="16">close</v-icon>
              </div>
              <span>No cape</span>
            </button>
            <button
              v-for="cape in accountCapes"
              :key="cape.id"
              class="apply-cape-option"
              :class="{ 'apply-cape-active': applyCapeUrl === cape.url }"
              @click="applyCapeUrl = cape.url"
            >
              <div class="apply-cape-img-wrap">
                <img :src="cape.url" alt="" class="apply-cape-img" />
              </div>
              <span>{{ cape.alias || cape.id }}</span>
              <v-icon v-if="cape.state === 'ACTIVE'" size="10" color="#22c55e" class="ml-1">check_circle</v-icon>
            </button>
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-6">
          <v-btn variant="outlined" class="dialog-btn" @click="applyDialog = false">Cancel</v-btn>
          <v-btn
            variant="flat"
            color="#22c55e"
            class="dialog-btn text-white font-semibold"
            :disabled="!!applyingId"
            @click="doApplySkin"
          >
            <v-icon size="14" class="mr-1">check</v-icon>
            {{ applyingId ? 'Applying...' : 'Apply to Account' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400" class="skin-dialog">
      <v-card class="dialog-card pa-6">
        <h3 class="text-lg font-bold text-white mb-2">Delete Skin</h3>
        <p class="text-sm opacity-60 mb-6">Are you sure you want to delete "{{ deleteTarget?.name }}"?</p>
        <div class="flex gap-3 justify-end">
          <v-btn variant="outlined" class="dialog-btn" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn variant="flat" color="#ef4444" class="dialog-btn text-white font-semibold" @click="doDelete">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Toast -->
    <v-snackbar v-model="toast.show" :timeout="2500" location="top" class="skin-toast">
      {{ toast.message }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive, watch } from 'vue'
import { useSkinData, type SkinEntry } from '@/composables/skinData'
import { kUserContext } from '@/composables/user'
import { injection } from '@/util/inject'
import SkinView from '@/components/SkinView.vue'
import { useService } from '@/composables'
import { UserServiceKey } from '@xmcl/runtime-api'
import { renderMinecraftPlayerCharacter, renderMinecraftCape } from '@/util/avatarRenderer'
import defaultSkin from '@/assets/steve_skin.png'

const { skins, addSkin, removeSkin } = useSkinData()
const { userProfile, gameProfile } = injection(kUserContext)
const { uploadSkin } = useService(UserServiceKey)

// ── Dialogs ──
const uploadDialog = ref(false)
const applyDialog = ref(false)
const deleteDialog = ref(false)
const deleteTarget = ref<SkinEntry | null>(null)
const applyTarget = ref<SkinEntry | null>(null)
const applyingId = ref<string | null>(null)
const toast = reactive({ show: false, message: '' })

// ── Upload form state ──
const uploadFileDataUrl = ref('')
const uploadFileName = ref('')
const uploadName = ref('')
const uploadModel = ref<'classic' | 'slim'>('classic')
const uploadCapeUrl = ref<string>('') // '' = no cape
const uploadPreviewKey = ref(0)

// Refresh 3D preview when model or cape changes in upload dialog
watch(uploadModel, () => { uploadPreviewKey.value++ })
watch(uploadCapeUrl, () => { uploadPreviewKey.value++ })

// ── Apply cape selection ──
const applyCapeUrl = ref<string>('') // '' = no cape

// ── Real skin data fetched directly from Mojang API ──
const realSkinUrl = ref('')
const realCapeUrl = ref('')
const realSlim = ref(false)
const playerKey = ref(0)
const fetchingSkin = ref(false)
const capeRenderUrl = ref('') // 2D rendered cape preview

// ── Rendered character previews for each uploaded skin ──
const skinPreviews = ref<Record<string, string>>({})

// Watch skins and render character previews for each
watch(() => skins.value, async (list) => {
  const results: Record<string, string> = {}
  for (const skin of list) {
    try {
      const rendered = await renderMinecraftPlayerCharacter(skin.skinUrl, 3)
      if (rendered) results[skin.id] = rendered
    } catch { /* fallback to raw texture */ }
  }
  skinPreviews.value = results
}, { immediate: true, deep: true })

function showToast(msg: string) {
  toast.message = msg
  toast.show = true
}

const playerName = computed(() => gameProfile.value?.name || '')
const playerUuid = computed(() => gameProfile.value?.id || '')
const accountCapes = computed(() => gameProfile.value?.capes || [])

// ── Fetch real skin & cape from Mojang session server ──

async function fetchRealSkin(uuid: string) {
  if (!uuid || uuid.length < 32) return
  fetchingSkin.value = true
  try {
    const resp = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}?unsigned=false`)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const texturesBase64 = data.properties?.find((p: any) => p.name === 'textures')?.value
    if (!texturesBase64) throw new Error('No textures in profile')
    const decoded = JSON.parse(atob(texturesBase64))
    const textures = decoded.textures || {}

    if (textures.SKIN?.url) {
      realSkinUrl.value = textures.SKIN.url
      realSlim.value = textures.SKIN.metadata?.model === 'slim'
    }
    if (textures.CAPE?.url) {
      realCapeUrl.value = textures.CAPE.url
      renderCapePreview(textures.CAPE.url)
    }
  } catch (e) {
    console.warn('Mojang API fetch failed, falling back to game profile:', e)
    if (gameProfile.value?.textures?.SKIN?.url) {
      realSkinUrl.value = gameProfile.value.textures.SKIN.url
      realSlim.value = gameProfile.value.textures.SKIN.metadata?.model === 'slim'
    } else {
      realSkinUrl.value = ''
      realSlim.value = false
    }
    const capeUrl = gameProfile.value?.textures?.CAPE?.url || ''
    realCapeUrl.value = capeUrl
    if (capeUrl) renderCapePreview(capeUrl)
  } finally {
    fetchingSkin.value = false
  }
}

async function renderCapePreview(url: string) {
  try {
    const rendered = await renderMinecraftCape(url, 2)
    if (rendered) capeRenderUrl.value = rendered
  } catch {
    // fallback: use raw URL
    capeRenderUrl.value = url
  }
}

watch(playerUuid, (uuid) => {
  if (uuid) {
    fetchRealSkin(uuid)
    playerKey.value++
  }
}, { immediate: true })

watch(() => gameProfile.value?.textures?.SKIN?.url, (newUrl) => {
  if (newUrl && !fetchingSkin.value) {
    realSkinUrl.value = newUrl
    realSlim.value = gameProfile.value?.textures?.SKIN?.metadata?.model === 'slim'
    const capeUrl = gameProfile.value?.textures?.CAPE?.url
    if (capeUrl) {
      realCapeUrl.value = capeUrl
      renderCapePreview(capeUrl)
    }
  }
})

// ── Check if a library skin matches the currently applied one ──

function isSkinApplied(skin: SkinEntry): boolean {
  if (!realSkinUrl.value) return false
  return skin.skinUrl === realSkinUrl.value
}

// ── Upload dialog ──

function triggerFilePicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.png'
  input.onchange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFileName.value = file.name
    uploadName.value = file.name.replace(/\.png$/i, '') || 'My Skin'
    const reader = new FileReader()
    reader.onload = (ev) => {
      uploadFileDataUrl.value = ev.target?.result as string
      uploadPreviewKey.value++ // refresh 3D preview
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function openUploadDialog() {
  uploadDialog.value = true
  uploadFileDataUrl.value = ''
  uploadFileName.value = ''
  uploadName.value = ''
  uploadModel.value = 'classic'
  uploadCapeUrl.value = realCapeUrl.value || ''
  uploadPreviewKey.value++
  setTimeout(() => triggerFilePicker(), 100)
}

function cancelUpload() {
  uploadDialog.value = false
  uploadFileDataUrl.value = ''
  uploadFileName.value = ''
  uploadName.value = ''
  uploadCapeUrl.value = ''
}

async function saveUpload() {
  if (!uploadFileDataUrl.value || !uploadName.value.trim()) return
  await addSkin({
    name: uploadName.value.trim(),
    model: uploadModel.value,
    skinUrl: uploadFileDataUrl.value,
  })
  showToast(`Uploaded "${uploadName.value.trim()}"`)
  cancelUpload()
}

// ── Apply dialog (skin + cape) ──

function openApplyDialog(skin: SkinEntry) {
  applyTarget.value = skin
  // Pre-select current active cape, or 'no cape' if none
  applyCapeUrl.value = realCapeUrl.value || ''
  applyDialog.value = true
}

async function doApplySkin() {
  const skin = applyTarget.value
  if (!skin || applyingId.value) return

  // Validate we have what we need
  if (!userProfile.value?.id) {
    showToast('Failed: No user logged in')
    return
  }
  if (!gameProfile.value?.id) {
    showToast('Failed: No game profile selected')
    return
  }
  if (!skin.skinUrl) {
    showToast('Failed: Skin has no texture data')
    return
  }

  applyingId.value = skin.id
  try {
    // Upload skin + cape change to Mojang API via the user service
    await uploadSkin({
      userId: userProfile.value.id,
      gameProfileId: gameProfile.value.id,
      skin: {
        url: skin.skinUrl,
        slim: skin.model === 'slim',
      },
      cape: applyCapeUrl.value, // '' = hide cape, URL = show that cape
    })
    showToast(`Applied "${skin.name}" to your account`)
    // Immediately update the 3D preview
    realSkinUrl.value = skin.skinUrl
    realSlim.value = skin.model === 'slim'
    if (applyCapeUrl.value) {
      realCapeUrl.value = applyCapeUrl.value
    } else {
      realCapeUrl.value = ''
    }
    playerKey.value++
    applyDialog.value = false
  } catch (err: any) {
    const errMsg = err?.message || err?.toString() || 'Unknown error'
    console.error('Failed to apply skin:', err)
    showToast(`Failed: ${errMsg}`)
  } finally {
    applyingId.value = null
  }
}

// ── Delete ──

function confirmDelete(skin: SkinEntry) {
  deleteTarget.value = skin
  deleteDialog.value = true
}

async function doDelete() {
  if (deleteTarget.value) {
    await removeSkin(deleteTarget.value.id)
    deleteTarget.value = null
    deleteDialog.value = false
    showToast('Skin deleted')
  }
}
</script>

<style scoped>
.skin-library {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 14px;
  height: 100%;
  padding: 14px;
  background: #0d0d0d;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}

.col-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: white;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* --- Library Column --- */
.col-library {
  overflow-y: auto;
}

.library-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.skin-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.add-skin-card {
  aspect-ratio: 2 / 3;
  border: 2px dashed #2a2a2a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}
.add-skin-card:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.skin-card {
  aspect-ratio: 2 / 3;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}
.skin-card:hover {
  border-color: #22c55e;
  transform: translateY(-2px);
}

.skin-card-img-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

.skin-card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.skin-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.skin-card:hover .skin-card-overlay { opacity: 1; }

.overlay-btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  transition: all 0.15s ease;
}
.overlay-btn-primary { background: #22c55e; color: white; }
.overlay-btn-primary:hover { background: #16a34a; }
.overlay-btn-delete { background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 6px; }
.overlay-btn-delete:hover { background: rgba(239, 68, 68, 0.35); }

.applied-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 5px;
  padding: 1px 6px;
  font-size: 0.55rem;
  font-weight: 600;
  color: #22c55e;
}

.skin-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-top: 1px solid #2a2a2a;
}

.skin-card-name {
  font-size: 0.6rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skin-card-model {
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 6px;
}

/* --- Preview Column --- */
.col-preview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.preview-player-name {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.preview-3d-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.preview-3d-view canvas { display: block; }

/* 2D Cape Preview */
.cape-2d-section {
  border-top: 1px solid #2a2a2a;
  padding-top: 10px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cape-2d-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.cape-2d-img {
  image-rendering: pixelated;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  max-width: 100%;
  height: auto;
}



/* --- Upload Dialog --- */
.upload-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
}

.upload-preview-3d {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-preview-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.upload-preview-empty {
  width: 180px;
  height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #141414;
  border: 1px dashed #2a2a2a;
  border-radius: 12px;
}

.upload-preview-3d canvas {
  border-radius: 12px;
}

.upload-form {
  display: flex;
  flex-direction: column;
}

.upload-dropzone {
  width: 100%;
  min-height: 80px;
  background: #1a1a1a;
  border: 2px dashed #2a2a2a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 10px 14px;
}
.upload-dropzone:hover { border-color: #22c55e; background: rgba(34, 197, 94, 0.03); }
.upload-dropzone-filled { border-style: solid; border-color: #22c55e; background: rgba(34, 197, 94, 0.05); }

.upload-thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.upload-filename { font-size: 0.75rem; color: white; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.upload-change-btn {
  background: rgba(255,255,255,0.08);
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  color: rgba(255,255,255,0.6);
  font-size: 0.65rem;
  cursor: pointer;
  flex-shrink: 0;
}
.upload-change-btn:hover { background: rgba(255,255,255,0.15); }

/* Upload cape list */
.upload-cape-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.upload-cape-opt {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.15s ease;
}
.upload-cape-opt:hover { border-color: rgba(34, 197, 94, 0.4); }
.upload-cape-active { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.08) !important; color: white !important; }

.upload-cape-thumb {
  width: 14px;
  height: 22px;
  overflow: hidden;
  border-radius: 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d0d0d;
}

.upload-cape-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.upload-cape-noimg {
  width: 14px;
  height: 22px;
  border-radius: 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 10px 12px;
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.form-input:focus { border-color: #22c55e; }
.form-input::placeholder { color: rgba(255, 255, 255, 0.2); }

.model-toggle-group { display: flex; gap: 10px; }

.model-toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}
.model-toggle-btn:hover { border-color: rgba(34, 197, 94, 0.4); }
.model-toggle-active { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.08) !important; color: white !important; }

.model-toggle-icon {
  width: 18px;
  height: 26px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
.model-toggle-icon-slim { width: 14px; }

/* --- Apply Dialog --- */
.apply-skin-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
}

.apply-skin-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
}

.apply-skin-info {
  display: flex;
  flex-direction: column;
}

.apply-skin-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.apply-skin-model {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.apply-cape-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.apply-cape-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
}
.apply-cape-option:hover { border-color: rgba(34, 197, 94, 0.4); }
.apply-cape-active { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.08) !important; color: white !important; }

.apply-cape-img-wrap {
  width: 20px;
  height: 30px;
  overflow: hidden;
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d0d0d;
  border: 1px solid #2a2a2a;
}

.apply-cape-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.apply-cape-noimg {
  width: 20px;
  height: 30px;
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* --- Dialog Shared --- */
.dialog-card {
  background: #141414 !important;
  border: 1px solid #2a2a2a;
  border-radius: 16px !important;
}

.dialog-btn {
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
}

/* Toast */
.skin-toast :deep(.v-snackbar__wrapper) {
  background: #1a1a1a !important;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  color: white;
}

/* Custom scrollbar */
.col-library::-webkit-scrollbar,
.apply-cape-list::-webkit-scrollbar {
  width: 4px;
}
.col-library::-webkit-scrollbar-track,
.apply-cape-list::-webkit-scrollbar-track {
  background: transparent;
}
.col-library::-webkit-scrollbar-thumb,
.apply-cape-list::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}
</style>
