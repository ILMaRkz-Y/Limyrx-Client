import { useEventBus } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'

const AGENT_CHAT_BUS_KEY = 'app:agent-chat'

export function useAgentChatBus() {
  return useEventBus<'show' | 'hide' | 'toggle' | 'show-css'>(AGENT_CHAT_BUS_KEY)
}

/**
 * Resolve the Limyrx Agent setup guide URL. The launcher ships the agent
 * pre-configured, so this is only a fallback reference — it points at the
 * Limyrx website.
 */
export function getAgentSetupDocUrl(): string {
  return 'https://client.limyrx.online'
}

/** Reactive Limyrx Agent setup guide URL. */
export function useAgentSetupDocUrl() {
  return computed(() => getAgentSetupDocUrl())
}

/**
 * Bind Ctrl/Cmd+Shift+A to toggle the agent chat drawer. Mirrors the
 * command-palette hotkey pattern in commandPalette.ts.
 *
 * Two extra hardening steps on top of the command palette:
 * - Layout-independent match: on AZERTY keyboards the key labelled "A" is
 *   at physical position KeyQ (e.code), while the QWERTY "A" position is
 *   KeyA. Matching the reported character (e.key === 'a') makes the hotkey
 *   work on every layout; matching e.code as a fallback covers exotic
 *   layouts where the character differs (e.g. Cyrillic).
 * - Capture phase on window with stopPropagation: useTextFieldBehavior
 *   registers a document-capture keydown handler that swallows
 *   Ctrl(+Shift)+A when a search field is focused; the window capture
 *   phase runs before document capture, so the agent hotkey always wins.
 */
export function useAgentChatHotkey(enabled: Ref<boolean> = ref(true)) {
  const bus = useAgentChatBus()
  function onKeyDown(e: KeyboardEvent) {
    if (!enabled.value) return
    const mod = e.ctrlKey || e.metaKey
    if (!mod || !e.shiftKey) return
    if (e.code === 'KeyA' || e.key.toLowerCase() === 'a') {
      e.preventDefault()
      e.stopPropagation()
      bus.emit('toggle')
    }
  }
  onMounted(() => window.addEventListener('keydown', onKeyDown, { capture: true }))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown, { capture: true }))
}
