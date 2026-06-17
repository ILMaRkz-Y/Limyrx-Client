<template>
  <v-dialog
    v-model="isShown"
    data-testid="add-instance-dialog"
    width="900"
    :persistent="true"
    transition="fade-transition"
    content-class="elevation-0"
  >
    <div class="add-instance-dialog-root">
      <!-- Glass background layer -->
      <div class="add-instance-glass" />

      <!-- Content -->
      <div class="add-instance-content">
        <!-- Header -->
        <div class="flex items-center px-6 pt-6 pb-4 relative z-10">
          <div class="flex items-center gap-3 flex-grow">
            <div class="add-instance-icon-wrap">
              <svg class="add-instance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div class="text-base font-bold tracking-tight" style="color: rgba(255,255,255,0.9);">
              <template v-if="steps[step - 1] === 'config'">
                {{ t('instances.add') }}
              </template>
              <template v-if="steps[step - 1] === 'server'">
                {{ t('AppAddInstanceDialog.serverTitle') }}
              </template>
            </div>
          </div>
          <button class="add-instance-migrate-btn" @click="onMigrateFromOther">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>{{ t("setting.migrateFromOther") }}</span>
          </button>
        </div>

        <div class="add-instance-divider" />

        <v-window v-model="step" class="visible-scroll overflow-y-auto">
          <v-window-item
            v-for="(tStep, i) in steps"
            :key="tStep"
            class="max-h-[70vh]"
            :value="i + 1"
          >
            <StepConfig
              v-if="tStep === 'config'"
              :loading="loading"
              v-model:valid="valid"
            />
            <StepServer
              v-if="tStep === 'server'"
              v-model:valid="valid"
            />
          </v-window-item>
        </v-window>
        <div class="add-instance-divider" />
        <StepperFooter
          class="px-6 pb-6 pt-4 relative z-10"
          :disabled="!valid || loading"
          :creating="loading"
          :next="step !== steps.length"
          :create="step === steps.length"
          @create="onCreate"
          @next="next"
          @quit="quit"
        >
          <div
            v-if="type === 'template' || type === 'manual' || !type"
            class="flex justify-end"
          >
            <button
              data-testid="add-instance-import"
              class="add-instance-import-btn"
              :disabled="loading"
              @click="onImportModpack"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <span>{{ t('importModpack.name') }}</span>
            </button>
          </div>
          <div
            v-if="error"
            class="pointer-events-none absolute left-0 flex w-full justify-center"
          >
            <div class="add-instance-error">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div class="flex flex-col">
                <span>{{ errorText }}</span>
                <span v-if="error?.path" class="text-xs opacity-60">{{ error?.path }}</span>
              </div>
            </div>
          </div>
        </StepperFooter>
      </div>
    </div>
  </v-dialog>
</template>

<script lang=ts setup>
import StepConfig from '@/components/StepConfig.vue'
import StepServer from '@/components/StepServer.vue'
import StepperFooter from '@/components/StepperFooter.vue'
import { useService } from '@/composables'
import { kInstance } from '@/composables/instance'
import { kInstanceVersionInstall } from '@/composables/instanceVersionInstall'
import { kInstances } from '@/composables/instances'
import { kJavaContext } from '@/composables/java'
import { useNotifier } from '@/composables/notifier'
import { kPeerShared } from '@/composables/peers'
import { kUserContext } from '@/composables/user'
import { getFTBTemplateAndFile } from '@/util/ftb'
import { injection } from '@/util/inject'
import { CachedFTBModpackVersionManifest, InstanceManifest, ModpackServiceKey, PeerServiceKey, waitModpackFiles } from '@xmcl/runtime-api'
import { useDialog } from '../composables/dialog'
import { kInstanceCreation, useInstanceCreation } from '../composables/instanceCreation'
import { AddInstanceDialogKey } from '../composables/instanceTemplates'

const type = ref(undefined as 'modrinth' | 'mmc' | 'server' | 'vanilla' | 'manual' | 'template' | 'prism' | undefined)

// Dialog model
const { openModpack } = useService(ModpackServiceKey)
const { all: javas } = injection(kJavaContext)
const onSelectModpack = async (modpack: string) => {
  try {
    loading.value = true
    const openedModpack = await openModpack(modpack)
    await update(openedModpack.config, waitModpackFiles(openedModpack))
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}
const onSelectFTB = async (ftb: CachedFTBModpackVersionManifest) => {
  try {
    loading.value = true
    const [config, files] = getFTBTemplateAndFile(ftb, javas.value)
    if (!config) return
    await update(config, Promise.resolve(files))
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}
const onSelectManifest = async (man: InstanceManifest) => {
  try {
    loading.value = true
    await update({
      name: man.name ?? '',
      description: man.description,
      minMemory: man.minMemory,
      maxMemory: man.maxMemory,
      vmOptions: man.vmOptions,
      mcOptions: man.mcOptions,
      runtime: man.runtime,
    }, Promise.resolve(man.files))
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

const { isShown, show, hide } = useDialog(AddInstanceDialogKey, (param) => {
  if (loading.value) {
    return
  }

  step.value = 1
  type.value = 'template'
  valid.value = true

  windowController.focus()

  if (!param) return

  if (typeof param === 'object') {
    const after = () => {
      type.value = 'template'
      nextTick(() => {
        step.value = 1
      })
    }
    if (param.format === 'modpack') {
      onSelectModpack(param.path).then(after)
    } else if (param.format === 'ftb') {
      onSelectFTB(param.manifest).then(after)
    } else if (param.format === 'manifest') {
      onSelectManifest(param.manifest).then(after)
    }
  }
}, () => {
  if (loading.value) {
    return
  }
  setTimeout(() => {
    step.value = 1
    valid.value = true
    type.value = 'template'
    reset()
  }, 500)
})
watch(isShown, (v) => {
  if (v) {
    windowController.focus()
  }
})
function quit() {
  if (loading.value) return
  hide()
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hide()
  }
})

const { t } = useI18n()

// Instance create data
const { gameProfile } = injection(kUserContext)
const { instances } = injection(kInstances)
const { path } = injection(kInstance)
const creation = useInstanceCreation(gameProfile, instances)
const { create, reset, error, update, loading } = creation
provide(kInstanceCreation, creation)

// Install
const router = useRouter()
const { fix } = injection(kInstanceVersionInstall)
const onCreate = async () => {
  const newPath = await create((newPath) => {
    path.value = newPath
    if (router.currentRoute.value.path !== '/') router.push('/')
    hide()
  })
  if (newPath === path.value) {
    await fix().catch(() => { })
  }
}

// Stepper model
const valid = ref(false)
const step = ref(1)
const errorText = computed(() => t('errors.BadInstanceType', { type: type.value === 'mmc' ? 'MultiMC' : type.value === 'modrinth' ? 'Modrinth' : type.value === 'prism' ? 'PrismLauncher' : '' }))
const steps = computed(() => {
  if (type.value === 'server') {
    return ['server', 'config']
  }

  return ['config']
})
function next() {
  if (step.value < steps.value.length) {
    step.value += 1
  }
}
function back() {
  if (step.value > 1) {
    step.value -= 1
  }
}

function onSelectTemplate() {
  type.value = 'template'
  step.value = 1
}

// Manuall import
const onImportModpack = () => {
  windowController.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: t('modpack.name', 2), extensions: ['zip', 'mrpack'] }],
  }).then(async (res) => {
    if (res.canceled) return
    const file = res.filePaths[0]
    try {
      loading.value = true
      await onSelectModpack(file)
      type.value = 'template'
      nextTick(() => {
        step.value = 1
      })
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  })
}

// Peer
const { on: onPeerService } = useService(PeerServiceKey)
const { notify } = useNotifier()
const { connections } = injection(kPeerShared)
onPeerService('share', (event) => {
  if (!event.manifest) {
    return
  }
  const conn = connections.value.find(c => c.id === event.id)
  if (conn) {
    notify({
      level: 'info',
      title: t('AppShareInstanceDialog.instanceShare', { user: conn.userInfo.name }),
      more() {
        if (!isShown.value && event.manifest) {
          show({ format: 'manifest', manifest: event.manifest })
        }
      },
    })
  }
})

const { show: onMigrateFromOther } = useDialog('migrate-wizard')
</script>

<style scoped>
.add-instance-dialog-root {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 255, 255, 0.03);
}

.add-instance-glass {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%);
  pointer-events: none;
  z-index: 0;
}

.add-instance-content {
  position: relative;
  z-index: 1;
}

.add-instance-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.add-instance-icon {
  width: 22px;
  height: 22px;
}

.add-instance-migrate-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-instance-migrate-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.add-instance-divider {
  height: 1px;
  margin: 0 24px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.08), transparent);
}

.add-instance-import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-instance-import-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.add-instance-import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-instance-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
}
</style>
