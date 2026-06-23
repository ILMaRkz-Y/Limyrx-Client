// ── Supabase REST client using plain fetch (no SDK dependency) ──
// This matches the same approach as the old Firebase code (`firebase.ts`).
// It avoids potential module resolution / compatibility issues in Electron.

const SUPABASE_URL = 'https://skpigopjjnposqdjkbld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcGlnb3Bqam5wb3NxZGprYmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzI1NzgsImV4cCI6MjA5NzgwODU3OH0.bz-0_KRXZ2IJKi5YnbjdiaGqREyPnC9t_1A4x_CJo1s'

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation',
}

function restUrl(table: string): string {
  return `${SUPABASE_URL}/rest/v1/${table}`
}

// ── Public API ──

/** SELECT rows from a table with optional filters */
export async function supabaseSelect<T = any>(
  table: string,
  options?: { select?: string; filters?: Record<string, any>; order?: string; ascending?: boolean; limit?: number },
): Promise<T[]> {
  const url = new URL(restUrl(table))
  url.searchParams.set('select', options?.select || '*')

  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      // value can be 'eq.value' or 'gte.value' etc. — pass as-is so the user controls the operator
      url.searchParams.set(key, String(value))
    }
  }
  if (options?.order) {
    url.searchParams.set('order', `${options.order}.${options.ascending !== false ? 'asc' : 'desc'}`)
  }
  if (options?.limit) {
    url.searchParams.set('limit', String(options.limit))
  }

  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) throw new Error(`supabaseSelect ${table}: ${res.status} ${res.statusText}`)
  return await res.json()
}

/** SELECT a single row (expects exactly one or zero) */
export async function supabaseGet<T = any>(
  table: string,
  filters: Record<string, any>,
  options?: { select?: string },
): Promise<T | null> {
  const url = new URL(restUrl(table))
  url.searchParams.set('select', options?.select || '*')
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, `eq.${value}`)
  }
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) throw new Error(`supabaseGet ${table}: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data?.[0] ?? null
}

/** INSERT a row (returns the inserted row) */
export async function supabaseInsert<T = any>(
  table: string,
  value: Record<string, any>,
): Promise<T> {
  const res = await fetch(restUrl(table), {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`supabaseInsert ${table}: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data?.[0] ?? data
}

/** UPSERT: insert or update based on conflict column */
export async function supabaseUpsert<T = any>(
  table: string,
  value: Record<string, any>,
  onConflict: string,
): Promise<T> {
  const url = new URL(restUrl(table))
  url.searchParams.set('on_conflict', onConflict)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`supabaseUpsert ${table}: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data?.[0] ?? data
}

/** UPDATE rows matching filters */
export async function supabaseUpdate(
  table: string,
  filters: Record<string, any>,
  value: Record<string, any>,
): Promise<void> {
  const url = new URL(restUrl(table))
  for (const [key, val] of Object.entries(filters)) {
    url.searchParams.set(key, `eq.${val}`)
  }

  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(value),
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(`supabaseUpdate ${table}: ${res.status} ${text}`)
  }
}

/** DELETE rows matching filters */
export async function supabaseDelete(
  table: string,
  filters: Record<string, any>,
): Promise<void> {
  const url = new URL(restUrl(table))
  for (const [key, val] of Object.entries(filters)) {
    url.searchParams.set(key, `eq.${val}`)
  }

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: HEADERS,
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(`supabaseDelete ${table}: ${res.status} ${text}`)
  }
}

/** Delete all rows from a table.
 *  Uses a negated filter to match every row (id ≠ 00000000-0000-0000-0000-000000000000).
 *  NOTE: This only works if every row has a non-null UUID `id` column.
 */
export async function supabaseClearTable(table: string): Promise<void> {
  // Supabase REST requires at least one filter for DELETE.
  // We use `id=neq.00000000-0000-0000-0000-000000000000` which matches every real row.
  const url = new URL(restUrl(table))
  url.searchParams.set('id', 'neq.00000000-0000-0000-0000-000000000000')
  const res = await fetch(url.toString(), { method: 'DELETE', headers: HEADERS })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(`supabaseClearTable ${table}: ${res.status} ${text}`)
  }
}

// ── Table name constants ──
export const TABLES = {
  PRESENCE: 'presence',
  SERVERS: 'servers',
  NEWS: 'news',
  TAGS: 'tags',
  NOTIFICATIONS: 'notifications',
  SKINS: 'skins',
  ADMIN_USERS: 'admin_users',
  PLAYER_AGGREGATES: 'player_aggregates',
  SERVER_HOURLY: 'server_hourly',
  /** @deprecated Supabase REST API v1 does not expose a dedicated "chats" table.
   *  Chat data is stored locally via localStorage (see limyrxFriends.ts).
   *  This entry is reserved for future server-side sync. */
  CHATS: 'chats',

  // ── Admin Enhancement Tables (from 20260623_admin_enhancements.sql) ──
  SERVER_DETAILS: 'server_details',
  USER_SESSIONS: 'user_sessions',
  LAUNCHER_SETTINGS: 'launcher_settings',
  MODERATION_LOGS: 'moderation_logs',
  FEEDBACK_TICKETS: 'feedback_tickets',
} as const