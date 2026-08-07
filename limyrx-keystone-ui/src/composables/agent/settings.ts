import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { DEFAULT_AGENT_API_KEY, DEFAULT_AGENT_ENDPOINT, DEFAULT_AGENT_MODEL } from './llm'

/**
 * Agent settings are a shared singleton: the settings page and the agent
 * session must read/write the SAME refs (including the derived `computed`
 * wrappers below), so editing the key in Settings immediately updates the
 * live agent's `available` state.
 *
 * All three fields ship pre-configured with the Limyrx Agent defaults, so
 * every user has the AI agent ready out of the box.
 */

/** Legacy / broken endpoints from earlier builds. Any stored value matching
 * one of these is ignored in favour of the current default. */
const BROKEN_ENDPOINTS = new Set([
  'https://opencode.big-pickle.com/v1/chat/completions',
  'https://apihub.agnes-ai.com/v1/chat/completions',
])

/** Model ids that no longer exist upstream (Agnes era). Any stored value
 * matching one of these is ignored in favour of the current default. */
const BROKEN_MODELS = new Set(['agnes-2.0-flash'])

/** Catch-all for other legacy `agnes-*` model ids that were not catalogued. */
const LEGACY_MODEL_RE = /^agnes[\s_-]?/i

/** API keys known to be rejected upstream (superseded defaults). Any stored
 * value matching one of these is ignored in favour of the current default,
 * so existing installs pick up the replacement key automatically. */
const BROKEN_KEYS = new Set([
  'sk-FnbV4PnnZbVXYczcwaMWiw07ZZBZfyhrJqw29hL4EFYyd9ERzlE7PWV6k4LAkCR3',
])

export const useAgentSettings = createSharedComposable(() => {
  const apiKey = useLocalStorage('agentApiKey', DEFAULT_AGENT_API_KEY)
  const endpoint = useLocalStorage('agentEndpoint', DEFAULT_AGENT_ENDPOINT)
  const model = useLocalStorage('agentModel', DEFAULT_AGENT_MODEL)

  // One-shot migration: older launcher builds persisted stale Agnes-era
  // values. Write the corrected defaults back so BOTH the settings page and
  // the live agent see sane values (resolved* computeds already ignore them,
  // but the settings inputs bind the raw refs).
  if (BROKEN_ENDPOINTS.has(endpoint.value.trim()) || !endpoint.value.trim()) {
    endpoint.value = DEFAULT_AGENT_ENDPOINT
  }
  if (BROKEN_MODELS.has(model.value.trim()) || LEGACY_MODEL_RE.test(model.value) || !model.value.trim()) {
    model.value = DEFAULT_AGENT_MODEL
  }
  if (BROKEN_KEYS.has(apiKey.value.trim()) || !apiKey.value.trim()) {
    apiKey.value = DEFAULT_AGENT_API_KEY
  }

  const resolvedApiKey = computed(() => {
    const raw = apiKey.value.trim()
    if (raw && !BROKEN_KEYS.has(raw)) return raw
    // Fall back to the shipped default when the stored value is empty or a
    // known-rejected key (e.g. localStorage written by an older launcher
    // build that shipped a superseded default).
    return DEFAULT_AGENT_API_KEY
  })

  const resolvedEndpoint = computed(() => {
    const raw = endpoint.value.trim()
    if (raw && !BROKEN_ENDPOINTS.has(raw)) return raw
    return DEFAULT_AGENT_ENDPOINT
  })

  const resolvedModel = computed(() => {
    const raw = model.value.trim()
    if (raw && !BROKEN_MODELS.has(raw) && !LEGACY_MODEL_RE.test(raw)) return raw
    return DEFAULT_AGENT_MODEL
  })

  return {
    apiKey,
    endpoint,
    model,
    resolvedApiKey,
    resolvedEndpoint,
    resolvedModel,
  }
})
