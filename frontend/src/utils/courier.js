// Couriers for delivery orders. The admin picks one of these when the order ships, or types another courier's
// name ("Other"). Same list as the server (backend/helpers/delivery.php, COURIERS).
export const COURIERS = ['LBC', 'J&T Express']

// The courier's official website, where its tracking box is. Neither courier publishes a link that fills in the
// tracking number, so the page shows a Copy button next to the link and the customer pastes the number there.
const SITES = {
  LBC: 'https://www.lbcexpress.com/',
  'J&T Express': 'https://www.jtexpress.ph/',
}

// The tracking website for a courier, or null for another courier (no link then)
export const courierSite = (courier) => SITES[courier] ?? null

// The courier and tracking number typed by the admin (form: { courier, otherCourier, tracking }; courier is one of
// COURIERS or 'other'): { courier, tracking } to send, or { errors } when something is missing.
// The server checks the same (backend/helpers/delivery.php, read_tracking).
export function readTracking(form) {
  const courier = (form.courier === 'other' ? form.otherCourier : form.courier).trim()
  const tracking = form.tracking.trim()
  const errors = {}
  if (!courier) errors.courier = form.courier === 'other' ? 'Type the courier name.' : 'Choose the courier.'
  if (!tracking) errors.tracking = 'Enter the tracking number.'
  else if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(tracking)) errors.tracking = 'Only letters, numbers, spaces and dashes.'
  return Object.keys(errors).length ? { errors } : { courier, tracking }
}

// A shipping fee typed by the admin: "180", "1,200.50", "₱180" -> "180" / "1200.50"; null when it is not a peso
// amount (backend/helpers/delivery.php, read_shipping_fee, checks the same)
export function readFee(value) {
  const v = String(value).replace(/[\s₱]/g, '')
  // A comma only as a thousands separator: "1,200" yes, "1,80" no
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(v)) return null
  const plain = v.replace(/,/g, '')
  return /^\d{1,7}(\.\d{1,2})?$/.test(plain) ? plain : null
}
