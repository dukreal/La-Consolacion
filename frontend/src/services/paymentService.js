import { api } from './api'

// Sends the payment form (with the screenshot) to PHP.
//   productIds: one entry per item bought; the same id is repeated for quantity 2, 3, ...
//   quantities: optional list matching productIds (custom orders send [1])
// Returns PHP's answer: { success, order_id, amount, mobile, reference } or { success: false, error }
export function submitPayment({ service, amount, mobile, reference, screenshot, fromCart, productIds = [], quantities }) {
  const form = new FormData()
  form.append('service', service)
  form.append('amount', amount)
  form.append('mobile', mobile)
  form.append('reference', reference)
  form.append('from_cart', fromCart ? '1' : '0')
  form.append('payment_screenshot', screenshot)
  productIds.forEach((id) => form.append('product_id[]', id))
  if (quantities) quantities.forEach((qty) => form.append('quantity[]', qty))
  return api('/orders/payment.php', { method: 'POST', form })
}
