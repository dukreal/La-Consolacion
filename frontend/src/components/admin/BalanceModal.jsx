import { Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fieldClass, labelClass } from '../../utils/adminForm'
import { methodLabel } from '../../utils/storePayments'
import PaymentMethodPicker from './PaymentMethodPicker'

const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// "Collect the balance": shown instead of "Please confirm it" when an order is marked Completed while the customer
// still owes part of the price (the 70% after the 30% downpayment, paid at pickup).
// The admin picks how it was paid (and the e-wallet reference); onConfirm({ method, reference }) saves it together
// with the Completed status. Cancel / Escape / a click outside close it without changing anything.
export default function BalanceModal({ orderId, total, paid, balance, busy, onConfirm, onCancel }) {
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  const choose = (value) => {
    setMethod(value)
    if (value === 'CASH') setReference('') // cash has no reference number
  }
  const submit = (e) => {
    e.preventDefault()
    onConfirm({ method, reference: reference.trim() })
  }

  return (
    <div
      id="balanceModal"
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="balanceTitle"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex-shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 id="balanceTitle" className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Collect the balance</h3>
            <p className="text-sm text-gray-600">Order #{orderId} still has a balance to pay.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#f5f7fb] px-4 py-3">
          <div className="text-sm text-gray-600">Balance to collect</div>
          <div id="balanceAmount" className="text-2xl sm:text-3xl font-bold text-[#22306a]">{peso(balance)}</div>
          <div className="mt-1 text-xs text-gray-500">
            Total {peso(total)} · Already paid {peso(paid)}
          </div>
        </div>

        <h4 id="balanceMethodLabel" className="mt-5 mb-2 text-sm font-semibold text-gray-700">How did the customer pay?</h4>
        <PaymentMethodPicker name="balance_method" value={method} onChange={choose} labelledBy="balanceMethodLabel" />

        {method !== 'CASH' && (
          <label className={`${labelClass} mt-4`}>
            {methodLabel(method)} reference number
            <input
              type="text"
              id="balanceReference"
              name="balance_reference"
              placeholder="13-digit reference number"
              autoComplete="off"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={fieldClass}
            />
          </label>
        )}

        <p className="mt-4 text-xs text-gray-500">The order will be marked Completed. This can&apos;t be undone.</p>

        {/* Phones: full-width buttons, Record and complete on top. From 640px: side by side */}
        <div className="mt-4 flex flex-col-reverse sm:grid sm:grid-cols-[auto_minmax(0,1fr)] gap-3">
          <button
            type="button"
            id="balanceCancelBtn"
            onClick={onCancel}
            disabled={busy}
            className="h-11 px-5 rounded-[10px] bg-gray-200 [@media(hover:hover)]:hover:bg-gray-300 text-gray-800 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="balanceConfirmBtn"
            disabled={busy}
            className="min-h-11 px-4 py-2 rounded-[10px] bg-emerald-600 [@media(hover:hover)]:hover:bg-emerald-700 text-white font-semibold leading-tight transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Record and complete'}
          </button>
        </div>
      </form>
    </div>
  )
}
