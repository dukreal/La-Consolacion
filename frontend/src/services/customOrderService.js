import { api } from './api'

// One custom order: { id, name, price, downpayment, stock, image, customerName, email, description, status }
export async function getCustomOrder(id) {
  const data = await api(`/products/custom-order.php?id=${encodeURIComponent(id)}`)
  if (!data.success) throw new Error(data.error || 'Custom order not found.')
  return data.order
}
