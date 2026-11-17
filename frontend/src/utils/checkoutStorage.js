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
