import { api } from './api'

// Order counts and the 3 newest log entries for the Overview page.
export async function getOverview() {
  const data = await api('/admin/overview.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load the overview')
  return data
}
