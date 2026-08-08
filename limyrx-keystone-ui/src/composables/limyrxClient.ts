import { createSharedComposable } from '@vueuse/core'
import { LimyrxClientServiceKey, LimyrxContentUpdate, LimyrxUpdateResult } from '@xmcl/runtime-api'
import { Instance } from '@xmcl/instance'
import { shallowReactive, shallowRef } from 'vue'
import { useService } from './service'

/**
 * True when the instance is a Limyrx Client instance (selected through the
 * Limyrx Client modloader option, which stores the manifest key — the
 * Minecraft version — in `runtime.limyrx`).
 */
export function isLimyrxClientInstance(instance: Instance | undefined): boolean {
  return !!instance?.runtime.limyrx
}

export type LimyrxClientUpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'checked'; result: LimyrxContentUpdate }
  | { status: 'error'; error: unknown }

/**
 * Per-instance Limyrx Client content update state, shared across components.
 *
 * `check` compares the installed files against the freshly fetched manifest
 * and caches the result per instance path (the card doubles as the "update
 * available" indicator). `update` downloads only changed / missing files and
 * then re-checks so the indicator flips back to up-to-date.
 *
 * The cache is intentionally in-memory (per session): an update check already
 * hits the network to fetch a fresh manifest, so re-checking on every app
 * start is cheap enough.
 */
export const useLimyrxClientUpdate = createSharedComposable(() => {
  const service = useService(LimyrxClientServiceKey)

  /** Keyed by instance path. `shallowReactive` so `.get()` is tracked. */
  const cache = shallowReactive(new Map<string, LimyrxClientUpdateState>())
  /** The instance path currently being updated (or undefined). */
  const updating = shallowRef<string | undefined>()

  function getState(path: string): LimyrxClientUpdateState {
    return cache.get(path) ?? { status: 'idle' }
  }

  /**
   * Compare the instance content against the fresh manifest. Caches the
   * result. Throws on network / manifest errors so callers can surface them.
   */
  async function check(path: string, minecraft: string): Promise<LimyrxContentUpdate> {
    cache.set(path, { status: 'checking' })
    try {
      const result = await service.checkContentUpdate(path, minecraft)
      cache.set(path, { status: 'checked', result })
      return result
    } catch (e) {
      cache.set(path, { status: 'error', error: e })
      throw e
    }
  }

  /**
   * Download changed / missing files, then re-check so the indicator reflects
   * the fresh state. Returns the update result (installed / skipped counts).
   */
  async function update(path: string, minecraft: string): Promise<LimyrxUpdateResult> {
    updating.value = path
    try {
      const result = await service.updateContent(path, minecraft)
      // Re-check against the (now refreshed) manifest: the host may have
      // pushed a new manifest between the two calls, and the card should
      // show the truth.
      await check(path, minecraft)
      return result
    } finally {
      updating.value = undefined
    }
  }

  /** Drop the cached state (e.g. after the instance directory changed). */
  function invalidate(path: string): void {
    cache.delete(path)
  }

  return { getState, check, update, invalidate, updating }
})
