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

// Builds the form the Add Premade / Edit Product pages send (field names PHP reads)
function premadeForm(fields, image) {
  const form = new FormData()
  form.append('itemName', fields.name)
  form.append('itemPrice', fields.price)
  form.append('itemStock', fields.stock)
  form.append('itemType', fields.type)
  form.append('itemMaterial', fields.material)
  form.append('itemDescription', fields.description)
  if (image) form.append('itemImage', image)
  return form
}

// Adds a premade product (SuperAdmin only). Returns { success, id } or { success: false, error }
export function addProduct(fields, image) {
  return api('/products/add-product.php', { method: 'POST', form: premadeForm(fields, image) })
}

// One premade product for the Edit Product page: { product, adminLevel }
export function getProduct(id) {
  return api(`/products/edit-product.php?id=${id}`)
}

// Saves the Edit Product form. Admins (level 1) only change the stock; PHP ignores the rest.
export function updateProduct(id, fields, image) {
  const form = premadeForm(fields, image)
  form.append('id', id)
  return api('/products/edit-product.php', { method: 'POST', form })
}

// Builds the form the Add / Edit Custom Order pages send (field names PHP reads)
function customForm(fields, image) {
  const form = new FormData()
  form.append('customerName', fields.customerName)
  form.append('customerEmail', fields.email)
  form.append('productName', fields.productName)
  form.append('customPrice', fields.price)
  form.append('stock', fields.stock)
  form.append('customDescription', fields.description)
  if (image) form.append('customImage', image)
  return form
}

// Adds a custom order and emails the customer (SuperAdmin only).
// Returns { success, id, email, emailSent } or { success: false, error }
export function addCustomOrder(fields, image) {
  return api('/products/add-custom.php', { method: 'POST', form: customForm(fields, image) })
}

// One custom order for the Edit Custom Order page: { order }
export function getCustomOrderForEdit(id) {
  return api(`/products/edit-custom.php?id=${id}`)
}

// Saves the Edit Custom Order form
export function updateCustomOrder(id, fields, image) {
  const form = customForm(fields, image)
  form.append('customStatus', fields.status)
  form.append('id', id)
  return api('/products/edit-custom.php', { method: 'POST', form })
}

// Products that can be sold on the Walk-In page (in stock, not custom): { products }
export async function getWalkInProducts() {
  const data = await api('/admin/walk-in.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load products')
  return data
}

// Records a walk-in sale. method: 'CASH' | 'GCASH' | 'PAYMAYA' | 'GOTYME'
// Returns { success, orderId } or { success: false, error }
export function recordWalkInSale({ productId, quantity, method, reference }) {
  return api('/admin/walk-in.php', {
    method: 'POST',
    form: { product_id: productId, quantity, payment_method: method, reference_number: reference },
  })
}

// All orders for the Orders page: { orders, adminLevel }
export async function getOrders() {
  const data = await api('/admin/orders.php')
  if (!data.success) throw new Error(data.message || data.error || 'Could not load orders')
  return data
}

// Hides an order (SuperAdmin only). Returns { success } or { success: false, error }
export function deleteOrder(id) {
  return api('/orders/delete-order.php', { method: 'POST', form: { id } })
}
