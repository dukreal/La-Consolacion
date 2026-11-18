import { api } from './api'

// Order counts and the 3 newest log entries for the Overview page.
export async function getOverview() {
  const data = await api('/admin/overview.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load the overview')
  return data
}

// One page (8 rows) of activity logs: { logs, page, perPage, total, totalPages }
export async function getLogs(page = 1) {
  const data = await api(`/admin/logs.php?page=${page}`)
  if (!data.success) throw new Error(data.message || data.error || 'Could not load logs')
  return data
}

// All users for the Users page: { users, adminLevel, currentUserId }
export async function getUsers() {
  const data = await api('/admin/users.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load users')
  return data
}

// Saves the Edit User form. `role` ('user' | 'admin-1' | 'admin-2') is only sent by SuperAdmins.
// Returns PHP's answer: { success } or { success: false, error }
export function updateUser({ id, firstName, lastName, username, email, role }) {
  const form = { id, first_name: firstName, last_name: lastName, username, email }
  if (role) form.role = role
  return api('/users/edit-user.php', { method: 'POST', form })
}

// Soft-deletes a user (SuperAdmin only). Returns { success } or { success: false, error }
export function deleteUser(id) {
  return api('/users/delete-user.php', { method: 'POST', form: { id } })
}

// All products for the Inventory page: { products, adminLevel }
export async function getInventory() {
  const data = await api('/admin/inventory.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load the inventory')
  return data
}

// Soft-deletes a product (SuperAdmin only). Returns { success } or { success: false, error, message }
export function deleteProduct(id) {
  return api('/products/delete-product.php', { method: 'POST', form: { id } })
}
