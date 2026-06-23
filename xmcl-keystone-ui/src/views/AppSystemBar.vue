<template>
  <v-system-bar
    v-roving-tabindex
    topbar
    window
    role="toolbar"
    :aria-label="systemBarAriaLabel"
    class="moveable static! flex w-full grow-0 gap-1 p-0 text-[.875rem]! bg-[transparent]! dark:color-[#ffffffb3] pr-0"
    :style="{ 'backdrop-filter': `blur(${blurAppBar}px)` }"
  >
    <span
      v-if="back"
      class="flex shrink grow-0 p-0 h-full items-center"
    >
      <div
        v-if="shouldShiftBackControl"
        style="width: 80px"
      />
      <button
        type="button"
        v-ripple
        class="system-bar-back-btn non-moveable flex cursor-pointer select-none items-center h-full hover:bg-[rgba(255,255,255,0.2)]"
        style="width: 80px;"
        :aria-label="backAriaLabel"
        @click="onBack"
      >
        <v-icon size="small" aria-hidden="true">
          arrow_back
        </v-icon>
      </button>
    </span>
    <slot />

    <AppSystemBarBadge
      v-if="playerCount > 0"
      icon="people"
      :text="`${playerCount} online`"
      can-hide-text
    />
    <AppSystemBarBadge
      v-else
      icon="people_outline"
      text="..."
      can-hide-text
    />

    <div class="notification-wrapper">
      <AppSystemBarBadge
        icon="notifications_none"
        text=""
        can-hide-text
        @click="showNotifications = !showNotifications"
      >
        <template #append>
          <span v-if="adminData.unreadCount.value > 0" class="notif-dot" />
        </template>
      </AppSystemBarBadge>
      <div v-if="showNotifications" class="notif-dropdown">
        <div class="notif-header">
          <span class="notif-header-title">Notifications</span>
          <button
            v-if="adminData.unreadCount.value > 0"
            class="notif-mark-all"
            @click="markAllRead"
          >
            Mark all read
          </button>
        </div>
        <div v-if="allNotifications.length === 0" class="notif-empty">
          <v-icon size="28" class="mb-2">notifications_off</v-icon>
          <span>No notifications</span>
        </div>
        <div
          v-for="n in allNotifications"
          :key="n.id"
          class="notif-item"
          :class="{ 'notif-unread': !adminData.isRead(n.id) }"
        >
          <div class="notif-item-top">
            <div class="notif-item-title">{{ n.title }}</div>
            <span class="notif-date">{{ formatDate(n.date) }}</span>
          </div>
          <div class="notif-item-msg">{{ n.message }}</div>
          <div v-if="!adminData.isRead(n.id)" class="notif-item-actions">
            <button class="notif-read-btn" @click="markRead(n.id)">Mark as read</button>
          </div>
        </div>
      </div>
    </div>

    <AppAudioPlayer
      v-if="!noDebug"
      class="ml-22"
    />

    <div class="flex-grow"/>

    <AppSystemBarBadge
      v-if="!noUser"
      v-shared-tooltip.bottom="() => t('commandPalette.openHint', { shortcut: paletteShortcut })"
      icon="search"
      :text="t('commandPalette.open')"
      :aria-label="t('commandPalette.openHint', { shortcut: paletteShortcut })"
      can-hide-text
      @click="openPalette"
    >
      <template #append>
        <kbd class="palette-hotkey">{{ paletteShortcut }}</kbd>
      </template>
    </AppSystemBarBadge>


    <AppSystemBarBadge
      v-if="!noTask"
      v-shared-tooltip.bottom="() => taskTooltip"
      icon="assignment"
      :can-hide-text="!taskInlineText"
      :text="taskInlineText"
      @click="showTaskDialog()"
    />
    <AppSystemBarBadge
      v-if="tutor"
      id="tutor-button"
      icon="quiz"
      :text="t('help')"
      can-hide-text
      @click="tutor.start()"
    />
    <AppSystemBarBadge
      v-if="!noDebug"
      id="feedback-button"
      icon="bug_report"
      :text="t('feedback.name')"
      can-hide-text
      @click="showFeedbackDialog"
    />

    <span
      v-roving-tabindex
      class="flex h-full shrink grow-0 p-0"
      role="group"
      :aria-label="windowControlsAriaLabel"
    >
      <button
        v-if="!hideWindowControl"
        type="button"
        v-ripple
        :aria-label="minimizeAriaLabel"
        class="non-moveable system-btn hover:bg-[rgba(255,255,255,0.5)]"
        @click="minimize"
      >
        <v-icon size="small" aria-hidden="true">minimize</v-icon>
      </button>
      <button
        v-if="!hideWindowControl"
        type="button"
        v-ripple
        :aria-label="maximizeAriaLabel"
        class="non-moveable system-btn hover:bg-[rgba(255,255,255,0.5)]"
        @click="maximize"
      >
        <v-icon size="small" aria-hidden="true">crop_din</v-icon>
      </button>
      <button
        v-if="!hideWindowControl"
        type="button"
        v-ripple
        :aria-label="closeAriaLabel"
        class="non-moveable system-btn hover:bg-[rgb(209,12,12)]"
        @click="close"
      >
        <v-icon size="small" aria-hidden="true">close</v-icon>
      </button>
    </span>
  </v-system-bar>
</template>
<script lang="ts" setup>
import { useDialog } from '../composables/dialog'
import { useTaskCount } from '../composables/task'

import { injection } from '@/util/inject'
import { useOnlinePlayers } from '@/composables/onlinePlayers'
import { useAdminData, type AdminNotification } from '@/composables/adminData'
import { kUserContext } from '@/composables/user'
import { useWindowStyle } from '@/composables/windowStyle'
import { kTutorial } from '@/composables/tutorial'
import AppSystemBarBadge from '@/components/AppSystemBarBadge.vue'
import AppAudioPlayer from '@/components/AppAudioPlayer.vue'
import { kTheme } from '@/composables/theme'
import { useCommandPaletteBus } from '@/composables/commandPalette'
import { kNetworkStatus } from '@/composables/useNetworkStatus'
import { vRovingTabindex } from '@/directives/rovingTabindex'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { getExpectedSize } from '@/util/size'

const props = defineProps<{
  noUser?: boolean
  noTask?: boolean
  noDebug?: boolean
  back?: boolean
}>()

const { appBarColor, blurAppBar } = injection(kTheme)
const { maximize, minimize, close, hide } = windowController
const { shouldShiftBackControl, hideWindowControl } = useWindowStyle()
const { show: showFeedbackDialog } = useDialog('feedback')
const { show: showTaskDialog } = useDialog('task')
const { t } = useI18n()
const { count } = useTaskCount()
// Optional: the standalone multiplayer/app windows don't provide network status.
const networkStatus = inject(kNetworkStatus, undefined)?.status ?? ref(null)
const tutor = inject(kTutorial, undefined)

const taskSpeedText = computed(() => networkStatus.value?.downloadSpeed
  ? `${getExpectedSize(networkStatus.value.downloadSpeed)}/s`
  : '')
const taskCountText = computed(() => count.value === 0
  ? t('task.empty')
  : t('task.nTaskRunning', { count: count.value }))
const taskInlineText = computed(() => {
  if (count.value === 0) return ''
  return taskSpeedText.value || taskCountText.value
})
const taskTooltip = computed(() => {
  if (count.value === 0) return t('task.empty')
  if (taskSpeedText.value) return `${taskCountText.value} · ${taskSpeedText.value}`
  return taskCountText.value
})

const paletteBus = useCommandPaletteBus()
const paletteShortcut = computed(() => navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K')
const openPalette = () => paletteBus.emit('show')

const router = useRouter()
const onBack = () => {
  router.back()
}

const { gameProfile, userProfile } = injection(kUserContext)
const { online: playerOnline, playerCount, start: startPresence } = useOnlinePlayers()




const adminData = useAdminData()
const showNotifications = ref(false)
const allNotifications = computed(() => {
  const result: AdminNotification[] = []
  if (adminData.notification.value.active && adminData.notification.value.id) {
    result.push(adminData.notification.value)
  }
  for (const n of adminData.notificationHistory.value) {
    if (!result.find(r => r.id === n.id)) {
      result.push(n)
    }
  }
  return result
})

function markRead(id: string) {
  adminData.markAsRead(id)
}

function markAllRead() {
  adminData.markAllAsRead()
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

// Click outside to close
function onClickOutside(e: MouseEvent) {
  const wrapper = document.querySelector('.notification-wrapper')
  if (wrapper && !wrapper.contains(e.target as Node)) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

const systemBarAriaLabel = 'Window'
const backAriaLabel = computed(() => t('shared.back'))
const minimizeAriaLabel = 'Minimize'
const maximizeAriaLabel = 'Maximize'
const closeAriaLabel = 'Close'
const windowControlsAriaLabel = 'Window controls'
</script>
<style lang="css" scoped>
.system-btn {
  @apply  h-full top-0 mr-0 flex cursor-pointer select-none items-center justify-center px-3 py-1 after:hidden! w-[40px] min-w-[40px];
  font-size: 16px !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  background: transparent;
  border: 0;
  color: inherit;
  appearance: none;
}

.system-btn:focus-visible,
.system-bar-back-btn:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: -2px;
}

.system-bar-back-btn {
  background: transparent;
  border: 0;
  color: inherit;
  appearance: none;
  justify-content: center;
}

.palette-hotkey {
  margin-left: 8px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(125, 125, 125, 0.18);
  border: 1px solid rgba(125, 125, 125, 0.28);
  color: inherit;
  opacity: 0.75;
}

@media (max-width: 880px) {
  .palette-hotkey {
    margin-left: 4px;
  }
}

.notification-wrapper {
  position: relative;
}

.notif-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff5252;
  border: 2px solid transparent;
  animation: notif-pulse 2s infinite;
}

@keyframes notif-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 380px;
  max-height: 480px;
  overflow-y: auto;
  background: rgba(30, 30, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.notif-header-title {
  font-weight: 700;
  font-size: 15px;
  color: #fff;
}

.notif-mark-all {
  font-size: 12px;
  color: #64b5f6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.notif-mark-all:hover {
  background: rgba(100, 181, 246, 0.12);
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

.notif-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s;
}

.notif-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-unread {
  background: rgba(100, 181, 246, 0.06);
  border-left: 3px solid #64b5f6;
}

.notif-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.notif-item-title {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
}

.notif-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
  margin-left: 8px;
}

.notif-item-msg {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.4;
  word-break: break-word;
}

.notif-item-actions {
  margin-top: 6px;
}

.notif-read-btn {
  font-size: 11px;
  color: #81c784;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.notif-read-btn:hover {
  background: rgba(129, 199, 132, 0.12);
}
</style>
