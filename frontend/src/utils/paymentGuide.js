// The "How to pay" steps on step 2 of every payment page, worded for the e-wallet the customer chose.
// Based on each app's own help pages: GCash ("QR" button, "Ref No." on the success screen) and GoTyme
// ("Scan QR", then a success message and a receipt). Maya's exact receipt label is not confirmed yet,
// so it says "reference number".
const GUIDES = {
  gcash: { name: 'GCash', scanButton: 'QR', refLabel: 'Ref No.', refPlace: 'success screen' },
  paymaya: { name: 'PayMaya', scanButton: null, refLabel: 'reference number', refPlace: 'receipt' },
  gotyme: { name: 'GoTyme', scanButton: 'Scan QR', refLabel: 'reference number', refPlace: 'success screen or receipt' },
}

// { name, scanButton, refLabel, refPlace } for 'gcash', 'paymaya' or 'gotyme' (GCash when unknown)
export function paymentGuide(service) {
  return GUIDES[String(service).toLowerCase()] ?? GUIDES.gcash
}
