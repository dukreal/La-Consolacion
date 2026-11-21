// The four ways to pay at the store (same values the server expects, see backend/helpers/payments.php).
// Used by the Walk-in Order page and the "Collect the balance" step of the order pop-up.
export const STORE_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH', label: 'GCash', logo: '/images/gcash-logo.png' },
  { value: 'PAYMAYA', label: 'Maya', logo: '/images/maya-logo.png' },
  { value: 'GOTYME', label: 'GoTyme', logo: '/images/gotyme-logo.png' },
]

// 'GCASH' -> 'GCash'
export const methodLabel = (value) => STORE_METHODS.find((m) => m.value === value)?.label ?? value
