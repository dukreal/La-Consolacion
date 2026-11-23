// The delivery address, the same keys as the server (backend/helpers/delivery.php):
// name, mobile, street, barangay, city, province, zip, notes.

export const EMPTY_ADDRESS = { name: '', mobile: '', street: '', barangay: '', city: '', province: '', zip: '', notes: '' }

export const ADDRESS_FIELDS = [
  { key: 'name', label: 'Recipient name', autoComplete: 'name', max: 150 },
  { key: 'mobile', label: 'Mobile number', autoComplete: 'tel', placeholder: '09XXXXXXXXX', max: 11, numeric: true },
  { key: 'street', label: 'House no., street, subdivision', autoComplete: 'address-line1', placeholder: 'e.g. 12 Rizal St., Villa Ernesto', max: 255 },
  { key: 'barangay', label: 'Barangay', autoComplete: 'address-line2', placeholder: 'e.g. Carmen', max: 100 },
  { key: 'city', label: 'City / Municipality', autoComplete: 'address-level2', placeholder: 'e.g. Cagayan de Oro', max: 100 },
  { key: 'province', label: 'Province', autoComplete: 'address-level1', placeholder: 'e.g. Misamis Oriental', max: 100 },
  { key: 'zip', label: 'ZIP code', autoComplete: 'postal-code', placeholder: 'e.g. 9000', max: 4, numeric: true },
  { key: 'notes', label: 'Landmark or notes', autoComplete: 'off', placeholder: 'e.g. Blue gate beside the chapel', max: 255, optional: true },
]

// Fills in the missing keys (an address from the server has null for empty ones)
export const toAddress = (value) =>
  Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((key) => [key, value?.[key] == null ? '' : String(value[key])]))

// { key: message } for every field that is not right; empty when the address can be used
export function validateAddress(address) {
  const errors = {}
  for (const field of ADDRESS_FIELDS) {
    if (!field.optional && !address[field.key].trim()) errors[field.key] = `${field.label} is required.`
  }
  if (!errors.mobile && !/^09\d{9}$/.test(address.mobile)) errors.mobile = 'Must be 11 digits and start with 09.'
  if (!errors.zip && !/^\d{4}$/.test(address.zip)) errors.zip = 'Must be 4 digits.'
  return errors
}

// The address as lines, the same as the emails:
//   Maria Santos · 09171234567 / 12 Rizal St., Brgy. Carmen / Cagayan de Oro, Misamis Oriental 9000
export function addressLines(address) {
  const barangay = String(address.barangay || '').replace(/^(brgy\.?|barangay)\s*/i, '')
  return [`${address.name} · ${address.mobile}`, `${address.street}, Brgy. ${barangay}`, `${address.city}, ${address.province} ${address.zip}`]
}
