// Every call to the PHP backend goes through this helper.
const BASE = '/api'

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include', // sends the PHP session cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}