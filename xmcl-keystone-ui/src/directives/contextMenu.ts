import { ObjectDirective } from 'vue'
import { ContextMenuItem, useContextMenu } from '../composables/contextMenu'

type Binding = undefined | (ContextMenuItem[]) | (() => ContextMenuItem[])

const handlers = new WeakMap<HTMLElement, (e: MouseEvent) => void>()

export const vContextMenu: ObjectDirective<HTMLElement, Binding> = {
  mounted(el, bindings) {
    const { open } = useContextMenu()
    const handler = (e: MouseEvent) => {
      // Always prevent default browser context menu
      e.preventDefault()
      e.stopPropagation()

      const value = bindings.value
      if (value instanceof Array && value.length > 0) {
        open(e.clientX, e.clientY, value)
      } else if (typeof value === 'function') {
        open(e.clientX, e.clientY, value())
      }
    }
    handlers.set(el, handler)
    el.addEventListener('contextmenu', handler)
  },
  updated(el, bindings) {
    // Re-bind handler to pick up the latest bindings.value
    const oldHandler = handlers.get(el)
    if (oldHandler) {
      el.removeEventListener('contextmenu', oldHandler)
    }
    const { open } = useContextMenu()
    const handler = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const value = bindings.value
      if (value instanceof Array && value.length > 0) {
        open(e.clientX, e.clientY, value)
      } else if (typeof value === 'function') {
        open(e.clientX, e.clientY, value())
      }
    }
    handlers.set(el, handler)
    el.addEventListener('contextmenu', handler)
  },
  beforeUnmount(el) {
    const handler = handlers.get(el)
    if (handler) {
      el.removeEventListener('contextmenu', handler)
      handlers.delete(el)
    }
  },
}
