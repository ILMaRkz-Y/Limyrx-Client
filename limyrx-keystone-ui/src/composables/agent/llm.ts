/**
 * OpenAI-compatible chat client for the Limyrx Agent.
 *
 * Uses the opencode/big-pickle model via the configured endpoint.
 * Streaming is intentionally omitted — the loop needs the full tool-call
 * payload before it can dispatch, and the UI does not yet render partial
 * assistant text.
 */

export interface TextContentPart {
  type: 'text'
  text: string
}

export interface ImageContentPart {
  type: 'image_url'
  image_url: { url: string; detail?: 'auto' | 'low' | 'high' }
}

export type ContentPart = TextContentPart | ImageContentPart

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentPart[] | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export interface LLMResponse {
  content: string | null
  toolCalls: ToolCall[]
  model?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface LLMOptions {
  apiKey: string
  endpoint?: string
  model?: string
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

/**
 * Pre-configured defaults for the Limyrx Agent. Every user ships with these
 * out of the box — no manual API key / endpoint / model setup needed.
 */
export const DEFAULT_AGENT_API_KEY = 'sk-y5JGHeh2NYH0Td9m7LtQHnzCCRtUj2pLDCyOs5d71nhZEZMo5YY9UvsLefvTRHOl'
export const DEFAULT_AGENT_ENDPOINT = 'https://opencode.ai/zen/v1/chat/completions'
export const DEFAULT_AGENT_MODEL = 'big-pickle'

// Backwards-compat aliases (used by settings.ts imports)
export const DEFAULT_AGNES_ENDPOINT = DEFAULT_AGENT_ENDPOINT
export const DEFAULT_AGNES_MODEL = DEFAULT_AGENT_MODEL

export async function chat(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  options: LLMOptions,
): Promise<LLMResponse> {
  if (!options.apiKey) {
    throw new Error('Agent: API key is not configured')
  }

  const endpoint = options.endpoint ?? DEFAULT_AGNES_ENDPOINT
  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_AGNES_MODEL,
    messages,
    stream: false,
  }
  if (options.temperature !== undefined) body.temperature = options.temperature
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (tools.length > 0) {
    body.tools = tools
    body.tool_choice = 'auto'
  }

  // In the launcher the request is proxied through the main process: the
  // opencode.ai endpoint sends no CORS headers, so a renderer `fetch` would be
  // blocked by Chromium. Fall back to a direct fetch for plain-browser dev.
  const bridge = (window as any).windowController as
    | {
      agentRequest?: (p: { endpoint: string; apiKey: string; body: Record<string, unknown>; requestId?: string }) => Promise<{ ok: boolean; status: number; data?: unknown; error?: string }>
      agentAbort?: (requestId: string) => void
    }
    | undefined

  let data: {
    model?: string
    choices: Array<{
      message: {
        content: string | null
        tool_calls?: Array<{
          id: string
          type: 'function'
          function: { name: string; arguments: string }
        }>
      }
    }>
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  }

  if (bridge?.agentRequest) {
    if (options.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    const requestId = Math.random().toString(36).slice(2)
    const onAbort = () => bridge.agentAbort?.(requestId)
    options.signal?.addEventListener('abort', onAbort, { once: true })
    try {
      const result = await bridge.agentRequest({ endpoint, apiKey: options.apiKey, body, requestId })
      if (!result.ok) {
        throw new Error(`Agent LLM ${result.status}: ${result.error || 'unknown error'}`)
      }
      data = result.data as typeof data
    } finally {
      options.signal?.removeEventListener('abort', onAbort)
    }
  } else {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Agent LLM ${res.status}: ${text || res.statusText}`)
    }

    data = await res.json() as typeof data
  }

  const msg = data.choices[0]?.message
  if (!msg) throw new Error('Agent LLM: no choices in response')

  const toolCalls: ToolCall[] = (msg.tool_calls ?? []).map((c) => {
    let args: Record<string, unknown> = {}
    try { args = c.function.arguments ? JSON.parse(c.function.arguments) : {} }
    catch { /* leave empty — surface parse errors as empty args */ }
    return { id: c.id, name: c.function.name, arguments: args }
  })

  return {
    content: msg.content ?? null,
    toolCalls,
    model: data.model,
    usage: data.usage && {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  }
}
