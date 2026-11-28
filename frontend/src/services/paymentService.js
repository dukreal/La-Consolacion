import { api } from './api'

// Sends the payment form (with the screenshot) to PHP.
//   productIds: one entry per item bought; the same id is repeated for quantity 2, 3, ...
//   quantities: optional list matching productIds (custom orders send [1])
//   delivery: { fulfillment: 'pickup' | 'delivery', address, saveAddress } from useDelivery() (components/payment/DeliveryChoice)
// Returns PHP's answer: { success, order_id, amount, mobile, reference } or { success: false, error }
export function submitPayment({ amount, mobile, reference, screenshot, fromCart, productIds = [], quantities, delivery }) {
  const form = new FormData()
  form.append('amount', amount)
  form.append('mobile', mobile)
  form.append('reference', reference)
  form.append('from_cart', fromCart ? '1' : '0')
  form.append('payment_screenshot', screenshot)
  productIds.forEach((id) => form.append('product_id[]', id))
  if (quantities) quantities.forEach((qty) => form.append('quantity[]', qty))
  form.append('fulfillment', delivery?.fulfillment || 'pickup')
  if (delivery?.fulfillment === 'delivery') {
    Object.entries(delivery.address).forEach(([key, value]) => form.append(`delivery_${key}`, value))
    if (delivery.saveAddress) form.append('save_address', '1')
  }
  return api('/orders/payment.php', { method: 'POST', form })
}
