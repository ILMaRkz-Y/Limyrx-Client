const DB_URL = 'https://peerless-bond-473117-k1-default-rtdb.firebaseio.com'

export function fbUrl(path: string): string {
  return `${DB_URL}/${path}.json`
}

export async function fbGet<T>(path: string): Promise<T | null> {
  const res = await fetch(fbUrl(path))
  if (!res.ok) return null
  return await res.json() as T | null
}

export async function fbSet(path: string, value: any): Promise<void> {
  await fetch(fbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
}

export async function fbPush(path: string, value: any): Promise<string> {
  const res = await fetch(fbUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  const data = await res.json()
  return data.name as string
}

export async function fbRemove(path: string): Promise<void> {
  await fetch(fbUrl(path), { method: 'DELETE' })
}
