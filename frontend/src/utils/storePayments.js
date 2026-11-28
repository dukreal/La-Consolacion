// The two ways to pay at the store (same values the server expects, see backend/helpers/payments.php):
// cash, or the shop's InstaPay QR scanned with any e-wallet or bank app.
// Used by the Walk-in Order page and the "Collect the balance" step of the order pop-up.
export const STORE_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'INSTAPAY', label: 'InstaPay' },
]

// A payment's name as people read it: 'INSTAPAY' / 'InstaPay' -> 'InstaPay', 'CASH' -> 'Cash'.
// Payments saved before v1.9.0 can say gcash, paymaya or gotyme: those were InstaPay too.
const OLD_EWALLETS = ['GCASH', 'PAYMAYA', 'MAYA', 'GOTYME']
export const methodLabel = (value) => {
  const key = String(value ?? '').toUpperCase()
  if (OLD_EWALLETS.includes(key)) return 'InstaPay'
  return STORE_METHODS.find((m) => m.value === key)?.label ?? value
}
