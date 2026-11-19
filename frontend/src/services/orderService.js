import { api } from './api'

// The customer's orders, newest first (already formatted by PHP).
export async function getUserOrders() {
  const data = await api('/orders/get-user-orders.php')
  if (!data.success) throw new Error(data.error || 'Could not load orders')
  return data.orders
}

// One order with its products and payment. Throws with PHP's message when something is wrong.
export async function getOrderDetails(orderId) {
  const data = await api(`/orders/get-user-order-details.php?order_id=${orderId}`)
  if (data.error) throw new Error(data.error)
  return data
}

// Returns PHP's answer: { success, message } or { success: false, error }
export function cancelOrder(orderId) {
  return api('/orders/cancel-order.php', { method: 'POST', form: { order_id: orderId } })
}
