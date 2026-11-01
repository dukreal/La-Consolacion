// Every call to the PHP backend goes through this helper.
const BASE = '/api'

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include', // sends the PHP session cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  // The PHP endpoints always answer with JSON, even for errors (401, 422, ...),
  // so we return it and let each page read `success`, `error` or `errors`.
  try {
    return await res.json()
  } catch {
    throw new Error(`Server error (${res.status})`)
  }
}
