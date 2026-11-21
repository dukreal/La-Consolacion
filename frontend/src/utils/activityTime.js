// Dates and times for the activity lists (Overview's Recent Activity and the Logs page).
// The server sends "2026-11-20 10:58:31".
const toDate = (value) => new Date(String(value).replace(' ', 'T'))

// "Nov 20 · 10:58 AM" (short) or "Nov 20, 2026 · 10:58 AM"
export function formatActivityTime(value, withYear) {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return value
  const day = d.toLocaleDateString('en-US', withYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

// "10:58 AM"
export function formatTimeOnly(value) {
  const d = toDate(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// "2026-11-20" (used to group a list by day)
export const dayKey = (value) => String(value).slice(0, 10)

// The day heading: "Today · Nov 20, 2026", "Yesterday · Nov 19, 2026" or "Thursday · Nov 13, 2026"
export function formatDayHeading(value) {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return dayKey(value)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const same = (a, b) => a.toDateString() === b.toDateString()
  const name = same(d, today) ? 'Today' : same(d, yesterday) ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${name} · ${date}`
}

// Failed actions (e.g. "Email Notification Failed") are shown in red
export const isFailedAction = (action) => /fail/i.test(action || '')
