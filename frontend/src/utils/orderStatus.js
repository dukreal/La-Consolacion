// One place for how an order status looks, so Order History, both Order Details pop-ups and
// the admin Orders table always show the same color for the same status.
// Customers and admins see different words for one status: an order that is ready to collect
// is "Ready for Pickup" for the customer and "Waiting for Buyer" for the shop.
// (The database values are the five statuses admins can set: see update-order-status.php.)

// Full class names are written out so Tailwind can find them (it can't see "bg-${color}-50").
const COLORS = {
  yellow: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  blue: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  green: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  red: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  gray: { badge: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
}

//   label:      what customers see
//   adminLabel: what admins see (when it differs)
//   shortLabel: the narrow status column of the admin Orders table (when it differs)
const STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  processing: { label: 'Processing', color: 'blue' },
  waiting_for_buyer: { label: 'Ready for Pickup', adminLabel: 'Waiting for Buyer', shortLabel: 'Waiting', color: 'purple' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
}

// Admin pages show "Unpaid" until the payment is in (custom orders waiting for their downpayment)
const UNPAID = { label: 'Unpaid', color: 'orange' }

// "waiting_for_buyer" -> "Waiting for buyer", for any status not in the list above
const humanize = (status) => {
  const text = String(status || '').replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// { label, badge, dot } for a status.
//   admin: true for the admin pages (admin wording)
//   short: true for the admin Orders table column
//   unpaid: true shows "Unpaid" instead of the status
export function orderStatus(status, { admin = false, short = false, unpaid = false } = {}) {
  const known = unpaid ? UNPAID : STATUSES[status]
  // A status this list doesn't know is shown as itself in grey, never as "Pending"
  const entry = known || { label: humanize(status), color: 'gray' }
  let label = entry.label
  if (admin) label = (short && entry.shortLabel) || entry.adminLabel || entry.label
  return { label, ...COLORS[entry.color] }
}

// The statuses an admin can choose in the Order Details pop-up, in order: [{ value, label, dot }]
export const ADMIN_STATUS_OPTIONS = Object.keys(STATUSES).map((value) => {
  const { label, dot } = orderStatus(value, { admin: true })
  return { value, label, dot }
})
