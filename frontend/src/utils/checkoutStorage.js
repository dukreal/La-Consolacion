// The Shop leaves the order for the payment page in localStorage, using the same three
// keys as the old payment.html: cartItems, fromCart and cartTotal.
//   items:    [{ id, qty, name, price, image }]
//   fromCart: true when the items come from the cart, false for "Buy Now"
//   total:    only used by "Buy Now" (a single item)
export function saveCheckout({ items, fromCart, total }) {
  localStorage.setItem('cartItems', JSON.stringify(items))
  localStorage.setItem('fromCart', String(fromCart))
  if (total === undefined) localStorage.removeItem('cartTotal')
  else localStorage.setItem('cartTotal', String(total))
}

// What the Checkout page shows. Empty values when nothing (or something broken) was saved.
export function readCheckout() {
  let items = []
  try {
    const parsed = JSON.parse(localStorage.getItem('cartItems') || '[]')
    if (Array.isArray(parsed)) items = parsed
  } catch {
    items = []
  }
  const total = parseFloat(localStorage.getItem('cartTotal'))
  return {
    items,
    fromCart: localStorage.getItem('fromCart') === 'true',
    total: Number.isNaN(total) ? 0 : total,
  }
}

// After a successful payment, so the same order cannot be sent twice by reopening /checkout
export function clearCheckout() {
  localStorage.removeItem('cartItems')
  localStorage.removeItem('fromCart')
  localStorage.removeItem('cartTotal')
}
