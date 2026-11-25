import { Check, Copy, ExternalLink, Truck } from 'lucide-react'
import { useState } from 'react'
import { updateShipping } from '../../services/adminService'
import { COURIERS, courierSite, readFee, readTracking } from '../../utils/courier'
import { cancelButton, confirmButton } from '../../utils/dialogButtons'
import IconModal from './IconModal'

// The "Shipping" panel in the admin's Order Details, for delivery orders: three boxes that follow the order.
//   1 · Shipping fee         typed when the order is set to Waiting for Buyer; "Change fee" until the customer pays
//   2 · Payment              Waiting for payment → Payment to check (screenshot, "Payment doesn't match") → received
//   3 · Courier and tracking filled in with Completed (On its way); "Fix tracking no." afterwards
// The fee, courier and tracking typed for a status change live in OrderDetailsModal (they go with the status);
// the panel's own buttons (Change fee, Payment doesn't match, Fix tracking no.) save straight away.
//
//   data:      the order details (get-order-details.php)
//   selected:  the status picked in "Change Status"
//   form, setForm: { fee, courier, otherCourier, tracking } typed for the status change; errors: { fee, courier, tracking }
//   onRecordPayment(): "Record payment" (paid by chat): picks Completed, so Confirm Order asks how it was paid
//   onSaved(message):  a panel button saved something: reload the order and say so
//   onError(message):  it failed
const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
// "2026-11-26 09:14:00" -> "Nov 26, 9:14 AM"
const shortDateTime = (value) => {
  const d = new Date(String(value).replace(' ', 'T'))
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}
const serviceName = (s) => ({ gcash: 'GCash', paymaya: 'PayMaya', gotyme: 'GoTyme' })[String(s).toLowerCase()] ?? s

const boxBase = 'rounded-[14px] p-3.5 flex flex-col gap-1.5 min-w-0'
const boxTitle = 'text-xs font-semibold'
const inputClass =
  'h-10 w-full min-w-0 px-3 bg-white border border-[#d8dce8] rounded-[10px] text-gray-900 outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15'
const linkButton = 'self-start p-0 text-sm font-semibold text-[#2474b6] [@media(hover:hover)]:hover:text-[#22306a] outline-none focus-visible:underline'
const smallNavy = 'h-10 px-3 rounded-[10px] bg-[#22306a] [@media(hover:hover)]:hover:bg-[#1a2550] text-white text-sm font-semibold disabled:opacity-60'
const smallOutline = 'h-10 px-3 rounded-[10px] border border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold [@media(hover:hover)]:hover:bg-[#f5f6fa]'
const errorText = 'text-xs text-red-600'

// The courier dropdown plus "Other" name, and the tracking number (also used by "Fix tracking no.")
export function TrackingFields({ form, setForm, errors = {}, idPrefix }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return (
    <>
      <label htmlFor={`${idPrefix}Courier`} className="sr-only">Courier</label>
      <select id={`${idPrefix}Courier`} value={form.courier} onChange={set('courier')} className={inputClass}>
        <option value="">Choose courier…</option>
        {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="other">Other</option>
      </select>
      {form.courier === 'other' && (
        <>
          <label htmlFor={`${idPrefix}Other`} className="sr-only">Courier name</label>
          <input id={`${idPrefix}Other`} value={form.otherCourier} onChange={set('otherCourier')} maxLength={50} placeholder="Courier name" className={inputClass} />
        </>
      )}
      {errors.courier && <p className={errorText}>{errors.courier}</p>}
      <label htmlFor={`${idPrefix}Tracking`} className="sr-only">Tracking number</label>
      <input id={`${idPrefix}Tracking`} value={form.tracking} onChange={set('tracking')} maxLength={100} placeholder="Tracking number" autoComplete="off" className={inputClass} />
      {errors.tracking && <p className={errorText}>{errors.tracking}</p>}
    </>
  )
}

export default function ShippingPanel({ data, selected, form, setForm, errors, onRecordPayment, onSaved, onError }) {
  const { order } = data
  const status = order.status
  const fee = data.shippingFee
  const submitted = data.balanceSubmitted
  const shipped = status === 'completed'
  const shipping = selected === 'completed' && !shipped // the courier and tracking inputs are needed now

  const [saving, setSaving] = useState(false)
  const [editFee, setEditFee] = useState(null) // "Change fee": the new fee being typed
  const [fix, setFix] = useState(null) // "Fix tracking no.": { courier, otherCourier, tracking }
  const [fixErrors, setFixErrors] = useState({})
  const [askReject, setAskReject] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async (action, fields, done) => {
    setSaving(true)
    try {
      const res = await updateShipping(order.id, action, fields)
      if (res.success) {
        done()
        onSaved(res.message)
      } else onError(res.error || res.message || 'Could not save it.')
    } catch {
      onError('Could not save it. Please try again.')
    }
    setSaving(false)
  }

  const saveFee = () => {
    const value = readFee(editFee)
    if (value === null) return onError('Enter the shipping fee in pesos, for example 180 or 180.50.')
    run('fee', { shipping_fee: value }, () => setEditFee(null))
  }

  const startFix = () => {
    const known = COURIERS.includes(order.courier)
    setFix({ courier: known ? order.courier : 'other', otherCourier: known ? '' : order.courier ?? '', tracking: order.trackingNumber ?? '' })
    setFixErrors({})
  }
  const saveFix = () => {
    const t = readTracking(fix)
    if (t.errors) return setFixErrors(t.errors)
    run('tracking', { courier: t.courier, tracking_number: t.tracking }, () => setFix(null))
  }

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(order.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onError('Select the tracking number and copy it yourself.')
    }
  }

  // Box 1: the shipping fee
  let feeBox
  if (fee === null && !shipped && (selected === 'waiting_for_buyer' || selected === 'completed')) {
    feeBox = (
      <div className={`${boxBase} border-2 border-[#2474b6] shadow-[0_0_0_4px_rgba(36,116,182,0.12)]`}>
        <label htmlFor="shippingFeeInput" className={`${boxTitle} text-[#22306a]`}>1 · Shipping fee</label>
        <div className="flex items-center h-10 bg-white border border-[#d8dce8] rounded-[10px] px-3 focus-within:border-[#2474b6] focus-within:ring-4 focus-within:ring-[#2474b6]/15">
          <span className="text-gray-500 mr-1" aria-hidden="true">₱</span>
          <input
            id="shippingFeeInput"
            inputMode="decimal"
            value={form.fee}
            onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
            placeholder="0.00"
            autoComplete="off"
            className="w-full min-w-0 bg-transparent outline-none text-gray-900"
          />
        </div>
        {errors.fee ? <p className={errorText}>{errors.fee}</p> : <p className="text-xs text-gray-600">What the courier charges. The customer pays it with the balance.</p>}
      </div>
    )
  } else if (fee === null) {
    feeBox = (
      <div className={`${boxBase} border border-dashed border-gray-300 bg-gray-50`}>
        <span className={`${boxTitle} text-gray-500`}>1 · Shipping fee</span>
        <span className="text-sm text-gray-600">Typed when you set the order to Waiting for Buyer.</span>
      </div>
    )
  } else {
    const canChange = status === 'waiting_for_buyer' && !submitted && !data.balancePayment
    feeBox = (
      <div className={`${boxBase} border border-gray-200`}>
        <span className={`${boxTitle} text-gray-500`}>1 · Shipping fee</span>
        {editFee !== null ? (
          <>
            <label htmlFor="changeFeeInput" className="sr-only">New shipping fee</label>
            <div className="flex gap-1.5">
              <input id="changeFeeInput" inputMode="decimal" value={editFee} onChange={(e) => setEditFee(e.target.value)} className={inputClass} />
              <button type="button" onClick={saveFee} disabled={saving} className={smallNavy}>Save</button>
            </div>
            <button type="button" onClick={() => setEditFee(null)} className={`${linkButton} !text-gray-600`}>Cancel</button>
          </>
        ) : (
          <>
            <span className="text-xl font-bold text-gray-900">{peso(fee)}</span>
            <span className="text-xs text-gray-600">
              {shipped ? 'Paid with the balance' : submitted ? "Included in the customer's payment" : status === 'waiting_for_buyer' ? `The customer pays ${peso(data.balance)}` : 'Saved'}
            </span>
            {canChange && (
              <button type="button" onClick={() => setEditFee(String(fee))} className={linkButton}>Change fee</button>
            )}
          </>
        )}
      </div>
    )
  }

  // Box 2: the payment of the balance and the fee
  let payBox
  if (submitted) {
    payBox = (
      <div className={`${boxBase} border border-amber-200 bg-amber-50`}>
        <span className={`${boxTitle} text-amber-800`}>2 · Payment to check</span>
        <span className="font-bold text-gray-900">{peso(submitted.amount)} · {serviceName(submitted.service)}</span>
        <span className="text-xs text-gray-600 [overflow-wrap:anywhere]">
          Ref. {submitted.referenceNumber}
          <br />
          From {submitted.mobile} · {shortDateTime(submitted.paidAt)}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={`/uploads/payments/${submitted.image}`} target="_blank" rel="noreferrer" className={linkButton}>View screenshot</a>
          <button type="button" onClick={() => setAskReject(true)} className="self-start p-0 text-sm font-semibold text-red-700 [@media(hover:hover)]:hover:text-red-800 outline-none focus-visible:underline">
            Payment doesn&apos;t match
          </button>
        </div>
      </div>
    )
  } else if (shipped || (data.balance === 0 && fee !== null)) {
    const bp = data.balancePayment
    payBox = (
      <div className={`${boxBase} border border-emerald-200 bg-emerald-50`}>
        <span className={`${boxTitle} text-emerald-700 flex items-center gap-1`}>2 · Payment received <Check className="w-3.5 h-3.5" aria-hidden="true" /></span>
        {bp ? (
          <>
            <span className="font-bold text-gray-900">{peso(bp.amount)} · {serviceName(bp.service)}</span>
            <span className="text-xs text-gray-600 [overflow-wrap:anywhere]">Ref. {bp.referenceNumber} · {shortDateTime(bp.paidAt)}</span>
            {bp.image && <a href={`/uploads/payments/${bp.image}`} target="_blank" rel="noreferrer" className={linkButton}>View screenshot</a>}
          </>
        ) : (
          <span className="text-sm text-gray-700">Fully paid</span>
        )}
      </div>
    )
  } else if (status === 'waiting_for_buyer' && fee !== null) {
    payBox = (
      <div className={`${boxBase} border border-orange-200 bg-orange-50`}>
        <span className={`${boxTitle} text-orange-800`}>2 · Waiting for payment</span>
        <div className="flex justify-between gap-2 text-sm text-gray-600"><span>Remaining balance</span><span className="text-gray-900">{peso(data.balance - fee)}</span></div>
        <div className="flex justify-between gap-2 text-sm text-gray-600"><span>Shipping fee</span><span className="text-gray-900">{peso(fee)}</span></div>
        <div className="h-px bg-orange-200" />
        <div className="flex justify-between gap-2 text-sm font-bold text-orange-800"><span>To pay</span><span>{peso(data.balance)}</span></div>
        <span className="text-xs text-gray-600">
          Not paid yet. Paid by chat instead?{' '}
          <button type="button" onClick={onRecordPayment} className="p-0 font-semibold text-[#2474b6] [@media(hover:hover)]:hover:text-[#22306a] outline-none focus-visible:underline">Record payment</button>
        </span>
      </div>
    )
  } else {
    payBox = (
      <div className={`${boxBase} border border-dashed border-gray-300 bg-gray-50`}>
        <span className={`${boxTitle} text-gray-500`}>2 · Balance and shipping fee</span>
        <span className="text-sm text-gray-600">The customer pays them online once you set the fee{data.balance > 0 ? ` (balance now ${peso(data.balance)})` : ''}.</span>
      </div>
    )
  }

  // Box 3: courier and tracking number
  let trackBox
  if (shipped && fix) {
    trackBox = (
      <div className={`${boxBase} border-2 border-[#2474b6]`}>
        <span className={`${boxTitle} text-[#22306a]`}>3 · Fix courier and tracking</span>
        <TrackingFields
          form={fix}
          setForm={(update) => {
            setFix(update)
            setFixErrors({})
          }}
          errors={fixErrors}
          idPrefix="fix"
        />
        <div className="flex gap-1.5">
          <button type="button" onClick={saveFix} disabled={saving} className={smallNavy}>Save</button>
          <button type="button" onClick={() => setFix(null)} className={smallOutline}>Cancel</button>
        </div>
      </div>
    )
  } else if (shipped) {
    const site = courierSite(order.courier)
    trackBox = (
      <div className={`${boxBase} border border-gray-200`}>
        <span className={`${boxTitle} text-gray-500`}>3 · Shipped{order.dateCompleted ? ` ${shortDateTime(order.dateCompleted).split(',')[0]}` : ''} · {order.courier}</span>
        <span className="text-xs text-gray-600">Tracking number</span>
        <span className="text-lg font-bold tracking-wide text-[#22306a] [overflow-wrap:anywhere]">{order.trackingNumber}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" onClick={copyTracking} className={`${linkButton} inline-flex items-center gap-1`}>
            {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {site && (
            <a href={site} target="_blank" rel="noreferrer" className={`${linkButton} inline-flex items-center gap-1`}>
              Track on {order.courier} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
          <button type="button" onClick={startFix} className={`${linkButton} !text-gray-600 [@media(hover:hover)]:hover:!text-[#22306a]`}>Fix tracking no.</button>
        </div>
      </div>
    )
  } else if (shipping) {
    trackBox = (
      <div className={`${boxBase} border-2 border-[#2474b6] shadow-[0_0_0_4px_rgba(36,116,182,0.12)]`}>
        <span className={`${boxTitle} text-[#22306a]`}>3 · Courier and tracking</span>
        <TrackingFields form={form} setForm={setForm} errors={errors} idPrefix="ship" />
      </div>
    )
  } else {
    trackBox = (
      <div className={`${boxBase} border border-dashed border-gray-300 bg-gray-50`}>
        <span className={`${boxTitle} text-gray-500`}>3 · Courier and tracking</span>
        <span className="text-sm text-gray-600">Filled in when you ship, after the payment is checked.</span>
      </div>
    )
  }

  let note = null
  if (submitted && !shipped) note = 'Check the screenshot against your e-wallet, fill in box 3, then Confirm Order: the order is marked On its way and the customer gets the tracking number. "Payment doesn\'t match" takes the payment back so the customer can pay again (contact them to explain).'
  else if (shipped) note = 'The order is locked. Only the courier and tracking number can still be fixed, for a typo.'
  else if (status === 'waiting_for_buyer' && fee !== null) note = 'The customer was emailed this total with a Pay now link. When they pay, box 2 shows their screenshot to check.'
  else if (selected === 'waiting_for_buyer') note = 'Update Status saves the fee and emails the customer the total to pay.'

  return (
    <section id="shippingPanel" aria-labelledby="shippingPanelTitle" className="px-5 py-4 sm:px-6 border-b border-gray-100">
      <h3 id="shippingPanelTitle" className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        <Truck className="w-4 h-4 text-[#2474b6]" aria-hidden="true" />
        Shipping
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {feeBox}
        {payBox}
        {trackBox}
      </div>
      {note && <p className="mt-2.5 text-xs text-gray-600">{note}</p>}

      {askReject && (
        <IconModal
          id="rejectPaymentModal"
          type="warning"
          title="Payment doesn't match?"
          message={`The ${peso(submitted.amount)} payment is taken back and the customer can pay again from their order. Contact them to explain what was wrong.`}
          onClose={() => setAskReject(false)}
        >
          <button
            type="button"
            id="rejectPaymentYesBtn"
            onClick={() => {
              setAskReject(false)
              run('reject_payment', {}, () => {})
            }}
            className={confirmButton}
          >
            Take it back
          </button>
          <button type="button" onClick={() => setAskReject(false)} data-autofocus className={cancelButton}>
            Cancel
          </button>
        </IconModal>
      )}
    </section>
  )
}
