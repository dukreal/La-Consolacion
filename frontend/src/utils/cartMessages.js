// Turns the cart server's error text into a sentence for customers.
// The server sends things like "Cannot exceed available stock (3)" or "Product is out of stock";
// anything unexpected (a database problem, no connection) becomes a general "try again".
export function cartErrorMessage(error) {
  const text = String(error || '')
  const stock = text.match(/Cannot exceed available stock \((\d+)\)/i)
  if (stock) {
    return stock[1] === '1'
      ? "Only 1 available, and it's already in your cart."
      : `Only ${stock[1]} available, and they're already in your cart.`
  }
  if (/out of stock/i.test(text)) return 'Sorry, this item is out of stock.'
  if (/not logged in/i.test(text)) return 'Please log in again to continue.'
  if (/not found/i.test(text)) return 'This item is no longer available. Please refresh the page.'
  return 'Something went wrong. Please try again.'
}
