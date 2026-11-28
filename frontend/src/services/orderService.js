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

// Pays the rest of a delivery order online (Pay for Your Order page): the balance plus the shipping fee.
// The amount is worked out by PHP. Returns { success, amount } or { success: false, error }
export function payBalance({ orderId, mobile, reference, screenshot }) {
  const form = new FormData()
  form.append('order_id', orderId)
  form.append('mobile', mobile)
  form.append('reference', reference)
  form.append('payment_screenshot', screenshot)
  return api('/orders/pay-balance.php', { method: 'POST', form })
}
