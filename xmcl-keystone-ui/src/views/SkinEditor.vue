<template>
  <div class="skin-editor">
    <button class="back-btn" @click="goBack">
      <v-icon size="18">arrow_back</v-icon>
      Back
    </button>

    <div class="editor-layout">
      <!-- Left: Player Preview -->
      <div class="editor-preview">
        <div class="preview-card">
          <div class="preview-model-area">
            <UserSkin
              :user="previewUser"
              :profile="previewProfile"
              :inspect="false"
              :cape="selectedCapeUrl"
              :rotate-y="capeViewAngle"
            />
          </div>
          <div class="preview-name">{{ form.name || 'Unnamed Skin' }}</div>
          <div class="preview-cape-label" v-if="selectedCapeUrl">+ Cape applied</div>
        </div>

        <!-- Cape Selector -->
        <div class="editor-capes">
          <h4 class="section-label">Cape</h4>
          <div v-if="capes.length === 0" class="text-xs opacity-30">No capes available</div>
          <div v-else class="cape-grid">
            <div
              v-for="cape in capes"
              :key="cape.id"
              class="cape-option"
              :class="{ 'cape-option-active': selectedCapeUrl === cape.url }"
              @click="selectedCapeUrl = selectedCapeUrl === cape.url ? undefined : cape.url"
            >
              <div class="cape-option-img">
                <PlayerCape :src="cape.url" />
              </div>
              <span class="cape-option-name">{{ cape.alias || cape.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="editor-form">
        <h2 class="form-title">{{ isNew ? 'New Skin' : 'Edit Skin' }}</h2>

        <div class="form-group">
          <label class="form-label">Name</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="My Awesome Skin"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Player Model</label>
          <div class="radio-group">
            <label class="radio-option" :class="{ 'radio-active': form.model === 'classic' }">
              <input type="radio" v-model="form.model" value="classic" class="radio-hidden" />
              <div class="radio-visual">
                <div class="model-icon">4px</div>
                <span>Classic (3px)</span>
              </div>
            </label>
            <label class="radio-option" :class="{ 'radio-active': form.model === 'slim' }">
              <input type="radio" v-model="form.model" value="slim" class="radio-hidden" />
              <div class="radio-visual">
                <div class="model-icon model-icon-slim">3px</div>
                <span>Slim (3px)</span>
              </div>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Skin File</label>
          <div class="file-upload-area" @click="browseFile">
            <div v-if="form.skinUrl" class="file-preview">
              <img :src="form.skinUrl" alt="" class="file-preview-img" />
              <span class="file-preview-name">skin.png</span>
              <button class="file-clear" @click.stop="form.skinUrl = ''">
                <v-icon size="14">close</v-icon>
              </button>
            </div>
            <div v-else class="file-upload-placeholder">
              <v-icon size="28" color="#22c55e">add_photo_alternate</v-icon>
              <span class="text-sm font-medium mt-1 opacity-60">Browse PNG</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="action-btn action-cancel" @click="goBack">Cancel</button>
          <button class="action-btn action-save" @click="saveSkin(false)">Save</button>
          <button class="action-btn action-save-apply" @click="saveSkin(true)">Save &amp; Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSkinData, type SkinEntry } from '@/composables/skinData'
import { kUserContext } from '@/composables/user'
import { injection } from '@/util/inject'
import UserSkin from '@/components/UserSkin.vue'
import PlayerCape from '@/components/PlayerCape.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { skins, addSkin, updateSkin } = useSkinData()
const { userProfile, gameProfile } = injection(kUserContext)
const { show: showToast } = inject('toast') as any || { show: () => {} }

const capeViewAngle = Math.PI - 0.4
const skinId = computed(() => route.params.id as string)
const isNew = computed(() => !skinId.value || skinId.value === 'new')

const form = reactive({
  name: '',
  model: 'classic' as 'classic' | 'slim',
  skinUrl: '',
})

const selectedCapeUrl = ref<string | undefined>(undefined)
const capes = computed(() => gameProfile.value?.capes ?? [])

onMounted(() => {
  if (!isNew.value) {
    const existing = skins.value.find((s: any) => s.id === skinId.value)
    if (existing) {
      form.name = existing.name
      form.model = existing.model
      form.skinUrl = existing.skinUrl
      selectedCapeUrl.value = existing.capeUrl
    }
  }
})

const previewUser = computed(() => userProfile.value)

const previewProfile = computed(() => {
  const base = gameProfile.value
  if (!base) return undefined
  return {
    ...base,
    textures: {
      SKIN: {
        url: form.skinUrl || base.textures?.SKIN?.url || '',
        metadata: form.model === 'slim' ? { model: 'slim' } : undefined,
      },
    },
  } as any
})

function browseFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.png'
  input.onchange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        form.skinUrl = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

async function saveSkin(andApply: boolean) {
  if (!form.name.trim()) return
  if (!form.skinUrl) return

  try {
    if (isNew.value) {
      const created = await addSkin({
        name: form.name.trim(),
        model: form.model,
        skinUrl: form.skinUrl,
        capeUrl: selectedCapeUrl.value,
      })
      if (andApply && created) {
        localStorage.setItem('xmcl_applied_skin', created.id)
      }
    } else {
      await updateSkin(skinId.value, {
        name: form.name.trim(),
        model: form.model,
        skinUrl: form.skinUrl,
        capeUrl: selectedCapeUrl.value,
      })
      if (andApply) {
        localStorage.setItem('xmcl_applied_skin', skinId.value)
      }
    }
    router.push('/skins')
  } catch {}
}

function goBack() {
  router.push('/skins')
}
</script>

<style scoped>
.skin-editor {
  height: 100%;
  padding: 24px;
  background: #0d0d0d;
  overflow-y: auto;
  font-family: 'DM Sans', sans-serif;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 8px 16px;
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.back-btn:hover {
  border-color: #22c55e;
  background: #1a1a1a;
}

.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  max-width: 960px;
}

/* Preview Column */
.editor-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-card {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  overflow: hidden;
}

.preview-model-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.preview-name {
  padding: 12px 16px;
  border-top: 1px solid #2a2a2a;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  text-align: center;
}

.preview-cape-label {
  padding: 0 16px 12px;
  text-align: center;
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 500;
}

.editor-capes {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  padding: 16px;
}

.section-label {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.cape-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cape-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cape-option:hover {
  border-color: #22c55e;
}

.cape-option-active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.cape-option-img {
  width: 24px;
  height: 36px;
  overflow: hidden;
  border-radius: 4px;
  flex-shrink: 0;
}

.cape-option-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Form Column */
.editor-form {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  padding: 28px;
}

.form-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  color: white;
  margin-bottom: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 12px 14px;
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: #22c55e;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 12px;
}

.radio-option {
  flex: 1;
  cursor: pointer;
}

.radio-hidden {
  display: none;
}

.radio-visual {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
}

.radio-option:hover .radio-visual {
  border-color: rgba(34, 197, 94, 0.4);
}

.radio-active .radio-visual {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  color: white;
}

.model-icon {
  width: 20px;
  height: 28px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.model-icon-slim {
  width: 16px;
}

/* File Upload */
.file-upload-area {
  width: 100%;
  min-height: 120px;
  background: #1a1a1a;
  border: 2px dashed #2a2a2a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.file-upload-area:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.03);
}

.file-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  position: relative;
}

.file-preview-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #2a2a2a;
}

.file-preview-name {
  font-size: 0.85rem;
  color: white;
  font-weight: 500;
}

.file-clear {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.2);
  border: none;
  border-radius: 6px;
  padding: 4px;
  color: #ef4444;
  cursor: pointer;
  transition: background 0.15s ease;
}

.file-clear:hover {
  background: rgba(239, 68, 68, 0.4);
}

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.action-cancel {
  background: transparent;
  border: 1px solid #2a2a2a;
  color: rgba(255, 255, 255, 0.6);
}

.action-cancel:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.action-save {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.action-save:hover {
  background: rgba(255, 255, 255, 0.14);
}

.action-save-apply {
  background: #22c55e;
  color: white;
}

.action-save-apply:hover {
  background: #16a34a;
}

/* Custom scrollbar */
.skin-editor::-webkit-scrollbar {
  width: 4px;
}

.skin-editor::-webkit-scrollbar-track {
  background: transparent;
}

.skin-editor::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}
</style>

