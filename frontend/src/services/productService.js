import { api } from './api'

// Gets the premade products for the Shop (newest first).
export async function getProducts() {
  const data = await api('/products/list.php')
  if (!data.success) throw new Error(data.error || 'Could not load products')
  return data.products
}
