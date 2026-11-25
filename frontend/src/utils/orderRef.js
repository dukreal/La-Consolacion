// How an order is named for customers: "LCJ-0951" instead of the database number (#951).
// Same as the emails (backend/helpers/orders.php order_ref()); the admin pages keep the plain number.
export const orderRef = (id) => `LCJ-${String(id).padStart(4, '0')}`

// The order's title for customers: its first product, and how many more there are
// ("Crown Diamond Ring", "Crown Diamond Ring + 2 more")
export const orderTitle = (firstItem, lines) => `${firstItem || 'Order'}${lines > 1 ? ` + ${lines - 1} more` : ''}`

// "LCJ-0951" (or "lcj-951") -> 951, for links that name an order by its reference; null when it is not one
export const orderIdFromRef = (ref) => {
  const match = /^LCJ-(\d{1,9})$/i.exec(String(ref ?? '').trim())
  return match ? Number(match[1]) : null
}
