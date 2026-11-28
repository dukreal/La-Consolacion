import { Check, Copy, ExternalLink, Truck } from 'lucide-react'
import { useState } from 'react'
import { updateShipping } from '../../services/adminService'
import { COURIERS, courierSite, readFee, readTracking } from '../../utils/courier'
import { cancelButton, confirmButton } from '../../utils/dialogButtons'
import { methodLabel } from '../../utils/storePayments'
import IconModal from './IconModal'

// The "Shipping" panel in the admin's Order Details, for delivery orders. Three rows, like a receipt:
//   Shipping fee  typed when the order is set to Waiting for Buyer; "Change fee" until the customer pays
//   Payment       Not paid yet → Check this payment (screenshot, "Wrong payment") → Paid
//   Courier       filled in with Completed (On its way); "Edit tracking" afterwards
// From 640px each row is label | value | actions; on phones the label sits above the value and the actions below it.
// Written for the store's staff: plain words, no technical terms.
//
// The fee, courier and tracking typed for a status change live in OrderDetailsModal (they are sent with the status);
// the panel's own buttons (Change fee, Wrong payment, Edit tracking) save straight away.
//   data:      the order details (get-order-details.php)
//   selected:  the status picked in "Change Status"
//   form, setForm: { fee, courier, otherCourier, tracking } typed for the status change; errors: { fee, courier, tracking }
//   onRecordPayment(): "Record payment" (paid by chat or at the store): picks Completed, so Confirm Order asks how
//   onSaved(message):  a panel button saved something: reload the order and say so
//   onError(message):  it failed
const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
// "2026-11-26 09:14:00" -> "Nov 26, 9:14 AM" (or just "Nov 26")
const when = (value, withTime = true) => {
  const d = new Date(String(value).replace(' ', 'T'))
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return withTime ? `${day}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : day
}
const serviceName = methodLabel // InstaPay or Cash (utils/storePayments.js)

const inputClass =
  'h-10 w-full min-w-0 px-3 bg-white border border-[#d8dce8] rounded-[10px] text-gray-900 outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15'
const linkButton =
  'inline-flex items-center gap-1 p-0 text-sm font-semibold text-[#2474b6] whitespace-nowrap [@media(hover:hover)]:hover:text-[#22306a] outline-none focus-visible:underline'
const smallNavy = 'h-10 px-4 rounded-[10px] bg-[#22306a] [@media(hover:hover)]:hover:bg-[#1a2550] text-white text-sm font-semibold disabled:opacity-60'
const smallOutline = 'h-10 px-4 rounded-[10px] border border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold [@media(hover:hover)]:hover:bg-[#f5f6fa]'
const errorText = 'mt-1 text-xs text-red-600'
const muted = 'text-sm text-gray-500'
const amount = 'font-bold text-gray-900'
const subLine = 'mt-0.5 text-xs text-gray-500 [overflow-wrap:anywhere]'

function Badge({ tone, children }) {
  const tones = {
    orange: 'text-orange-800 bg-orange-50 border-orange-200',
    amber: 'text-amber-800 bg-amber-50 border-amber-200',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  }
  return <span className={`inline-flex items-center rounded-full border px-2 py-px text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

// One row: label | value | actions (stacked on phones)
function Row({ label, labelFor, children, actions, first = false }) {
  const Label = labelFor ? 'label' : 'div'
  return (
    <div className={`px-4 py-3 sm:grid sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:items-center ${first ? '' : 'border-t border-[#f0f2f6]'}`}>
      <Label {...(labelFor ? { htmlFor: labelFor } : {})} className="block mb-1 sm:mb-0 text-xs sm:text-sm font-semibold text-gray-500">
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
      {actions ? <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-x-4 sm:gap-x-3 gap-y-1.5 sm:justify-end">{actions}</div> : <div className="hidden sm:block" />}
    </div>
  )
}

// Separates actions on one line; on phones the actions can wrap, so they are spaced apart without dots
const Dot = () => <span aria-hidden="true" className="hidden sm:inline text-gray-300">·</span>

// The courier dropdown plus "Other" name, and the tracking number (for shipping and for "Edit tracking").
// From 640px the dropdown and the number sit side by side.
export function TrackingFields({ form, setForm, errors = {}, idPrefix }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="sm:w-44 flex-shrink-0 flex flex-col gap-2">
        <label htmlFor={`${idPrefix}Courier`} className="sr-only">Courier</label>
        <select id={`${idPrefix}Courier`} value={form.courier} onChange={set('courier')} className={inputClass}>
          <option value="">Choose courier…</option>
          {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="other">Other courier</option>
        </select>
        {form.courier === 'other' && (
          <>
            <label htmlFor={`${idPrefix}Other`} className="sr-only">Courier name</label>
            <input id={`${idPrefix}Other`} value={form.otherCourier} onChange={set('otherCourier')} maxLength={50} placeholder="Courier name" className={inputClass} />
          </>
        )}
        {errors.courier && <p className={errorText}>{errors.courier}</p>}
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor={`${idPrefix}Tracking`} className="sr-only">Tracking number</label>
        <input id={`${idPrefix}Tracking`} value={form.tracking} onChange={set('tracking')} maxLength={100} placeholder="Tracking number" autoComplete="off" className={inputClass} />
        {errors.tracking && <p className={errorText}>{errors.tracking}</p>}
      </div>
    </div>
  )
}

export default function ShippingPanel({ data, selected, form, setForm, errors, onRecordPayment, onSaved, onError }) {
  const { order } = data
  const status = order.status
  const fee = data.shippingFee
  const submitted = data.balanceSubmitted
  const shipped = status === 'completed'
  const shipping = selected === 'completed' && !shipped // the courier and tracking number are needed now

  const [saving, setSaving] = useState(false)
  const [editFee, setEditFee] = useState(null) // "Change fee": the new fee being typed
  const [edit, setEdit] = useState(null) // "Edit tracking": { courier, otherCourier, tracking }
  const [editErrors, setEditErrors] = useState({})
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

  const startEdit = () => {
    const known = COURIERS.includes(order.courier)
    setEdit({ courier: known ? order.courier : 'other', otherCourier: known ? '' : order.courier ?? '', tracking: order.trackingNumber ?? '' })
    setEditErrors({})
  }
  const saveEdit = () => {
    const t = readTracking(edit)
    if (t.errors) return setEditErrors(t.errors)
    run('tracking', { courier: t.courier, tracking_number: t.tracking }, () => setEdit(null))
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

  // ---- Shipping fee row
  const askFee = fee === null && !shipped && (selected === 'waiting_for_buyer' || selected === 'completed')
  const canChangeFee = status === 'waiting_for_buyer' && fee !== null && !submitted && !data.balancePayment
  let feeValue
  let feeActions = null
  if (askFee) {
    feeValue = (
      <>
        <div className="flex items-center h-10 sm:max-w-[12rem] bg-white border-2 border-[#2474b6] rounded-[10px] px-3 focus-within:ring-4 focus-within:ring-[#2474b6]/15">
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
        {errors.fee ? <p className={errorText}>{errors.fee}</p> : <p className={subLine}>What the courier charges for this parcel.</p>}
      </>
    )
  } else if (fee === null) {
    feeValue = <span className={muted}>Set it when the order is Waiting for Buyer</span>
  } else if (editFee !== null) {
    feeValue = (
      <div className="flex gap-2">
        <label htmlFor="changeFeeInput" className="sr-only">New shipping fee</label>
        <input id="changeFeeInput" inputMode="decimal" value={editFee} onChange={(e) => setEditFee(e.target.value)} className={`${inputClass} sm:max-w-[10rem]`} />
        <button type="button" onClick={saveFee} disabled={saving} className={smallNavy}>Save</button>
        <button type="button" onClick={() => setEditFee(null)} className={smallOutline}>Cancel</button>
      </div>
    )
  } else {
    feeValue = (
      <span>
        <span className={amount}>{peso(fee)}</span>
        {shipped && <span className={muted}> · paid with the balance</span>}
      </span>
    )
    if (canChangeFee) feeActions = <button type="button" onClick={() => setEditFee(String(fee))} className={linkButton}>Change fee</button>
  }

  // ---- Payment row
  let payValue
  let payActions = null
  if (submitted) {
    payValue = (
      <>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone="amber">Check this payment</Badge>
          <span className={amount}>{peso(submitted.amount)} · {serviceName(submitted.service)}</span>
        </div>
        <p className={subLine}>Ref. {submitted.referenceNumber} · from {submitted.mobile} · {when(submitted.paidAt)}</p>
      </>
    )
    payActions = (
      <>
        <a href={`/uploads/payments/${submitted.image}`} target="_blank" rel="noreferrer" className={linkButton}>See screenshot</a>
        <Dot />
        <button type="button" onClick={() => setAskReject(true)} className={`${linkButton} !text-red-700 [@media(hover:hover)]:hover:!text-red-800`}>Wrong payment</button>
      </>
    )
  } else if (shipped || (data.balance === 0 && fee !== null)) {
    const bp = data.balancePayment
    payValue = bp ? (
      <>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone="green">Paid</Badge>
          <span className={amount}>{peso(bp.amount)} · {serviceName(bp.service)}</span>
        </div>
        <p className={subLine}>Ref. {bp.referenceNumber} · {when(bp.paidAt, false)}</p>
      </>
    ) : (
      <div className="flex items-center gap-2"><Badge tone="green">Paid</Badge><span className={muted}>Fully paid</span></div>
    )
    if (bp?.image) payActions = <a href={`/uploads/payments/${bp.image}`} target="_blank" rel="noreferrer" className={linkButton}>See screenshot</a>
  } else if (status === 'waiting_for_buyer' && fee !== null) {
    payValue = (
      <>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone="orange">Not paid yet</Badge>
          <span className={amount}>{peso(data.balance)}</span>
          <span className={muted}>to pay</span>
        </div>
        <p className={subLine}>Balance {peso(data.balance - fee)} + shipping fee {peso(fee)}</p>
      </>
    )
    payActions = (
      <button type="button" onClick={onRecordPayment} title="The customer paid by chat or at the store" className={linkButton}>
        Record payment
      </button>
    )
  } else {
    payValue = (
      <span className={muted}>
        The customer pays online after you set the fee{data.balance > 0 ? ` (balance now ${peso(data.balance)})` : ''}
      </span>
    )
  }

  // ---- Courier row
  let courierValue
  let courierActions = null
  if (shipped && edit) {
    courierValue = (
      <>
        <TrackingFields
          form={edit}
          setForm={(update) => {
            setEdit(update)
            setEditErrors({})
          }}
          errors={editErrors}
          idPrefix="edit"
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={saveEdit} disabled={saving} className={smallNavy}>Save</button>
          <button type="button" onClick={() => setEdit(null)} className={smallOutline}>Cancel</button>
        </div>
      </>
    )
  } else if (shipped) {
    const site = courierSite(order.courier)
    courierValue = (
      <>
        <p className="text-xs text-gray-500">{order.courier}{order.dateCompleted ? ` · shipped ${when(order.dateCompleted, false)}` : ''}</p>
        <p className="text-lg font-bold tracking-wide text-[#22306a] [overflow-wrap:anywhere]">{order.trackingNumber}</p>
      </>
    )
    courierActions = (
      <>
        <button type="button" onClick={copyTracking} className={linkButton}>
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy number'}
        </button>
        {site && (
          <>
            <Dot />
            <a href={site} target="_blank" rel="noreferrer" className={linkButton}>
              Track parcel <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </>
        )}
        <Dot />
        <button type="button" onClick={startEdit} className={`${linkButton} !text-gray-600 [@media(hover:hover)]:hover:!text-[#22306a]`}>Edit tracking</button>
      </>
    )
  } else if (shipping) {
    courierValue = <TrackingFields form={form} setForm={setForm} errors={errors} idPrefix="ship" />
  } else {
    courierValue = <span className={muted}>Fill in when you ship</span>
  }

  let note = null
  if (submitted && !shipped) note = 'Check that the money is in the shop\'s account, fill in the courier and tracking number, then click Confirm Order.'
  else if (shipped) note = 'This order is finished. Only the tracking number can still be edited.'
  else if (status === 'waiting_for_buyer' && fee !== null) note = 'The customer got an email with this amount and a Pay now link.'
  else if (askFee && selected === 'waiting_for_buyer') note = 'Update Status saves the fee and emails the customer what to pay.'

  return (
    <section id="shippingPanel" aria-labelledby="shippingPanelTitle" className="px-5 py-4 sm:px-6 border-b border-gray-100">
      <h3 id="shippingPanelTitle" className="flex items-center gap-2 mb-2.5 text-sm font-semibold uppercase tracking-wider text-gray-500">
        <Truck className="w-4 h-4 text-[#2474b6]" aria-hidden="true" />
        Shipping
      </h3>
      <div className="rounded-[14px] border border-gray-200">
        <Row label="Shipping fee" labelFor={askFee ? 'shippingFeeInput' : undefined} actions={feeActions} first>
          {feeValue}
        </Row>
        <Row label="Payment" actions={payActions}>{payValue}</Row>
        <Row label="Courier" actions={courierActions}>{courierValue}</Row>
      </div>
      {note && <p className="mt-2 text-xs text-gray-600">{note}</p>}

      {askReject && (
        <IconModal
          id="rejectPaymentModal"
          type="warning"
          title="Remove this payment?"
          message={`The ${peso(submitted.amount)} payment will be removed, and the customer gets an email asking them to pay again. You can also message them to explain what was wrong.`}
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
            Remove payment
          </button>
          <button type="button" onClick={() => setAskReject(false)} data-autofocus className={cancelButton}>
            Cancel
          </button>
        </IconModal>
      )}
    </section>
  )
}
