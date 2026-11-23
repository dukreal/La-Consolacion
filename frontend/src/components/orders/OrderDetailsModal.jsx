import { useEffect, useState } from 'react'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { getOrderDetails } from '../../services/orderService'
import { addressLines } from '../../utils/address'
import { orderStatus } from '../../utils/orderStatus'
import { methodLabel } from '../../utils/storePayments'

// 1500 -> "₱1,500.00"
const money = (amount) => `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// MySQL sends "2026-11-04 10:30:00"; the "T" makes every browser (including Safari) read it.
const toDate = (value) => new Date(String(value).replace(' ', 'T'))
// "Nov 23, 2026 · 11:30 PM"
const dateTime = (value) =>
  `${toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${toDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
// "Nov 23"
const shortDate = (value) => toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const STORE = '170 Capistrano St, Cagayan de Oro · Mon–Sat, 9 AM – 5 PM'

// 'gcash' / 'GCASH' -> 'GCash'
const wallet = (service) => methodLabel(String(service || '').toUpperCase())

// The four steps an order goes through; `done` is how many are finished for each status
const STEPS = ['Order placed', 'Processing', 'Ready', 'Completed']
const DONE = { pending: 1, processing: 2, waiting_for_buyer: 3, completed: 4 }

// Product picture, with a gem icon when the file is missing
function ProductThumb({ product }) {
  const [failed, setFailed] = useState(!product.image)
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
      {failed ? (
        <div className="w-full h-full bg-gradient-to-br from-[#e8ecf6] to-[#d5dcee] flex items-center justify-center">
          <i className="bx bx-diamond text-xl text-[#22306a]" aria-hidden="true"></i>
        </div>
      ) : (
        <img
          src={`/uploads/${product.type === 'custom' ? 'custom' : 'products'}/${product.image}`}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// Order placed → Processing → Ready → Completed. The current step has a ring; finished ones a check.
function Progress({ status }) {
  const done = DONE[status] ?? 1
  return (
    <ol id="orderProgress" aria-label="Order progress" className="grid grid-cols-4">
      {STEPS.map((step, index) => {
        const finished = index < done - 1 || (status === 'completed' && index === 3)
        const current = index === done - 1 && status !== 'completed'
        return (
          <li
            key={step}
            aria-current={current ? 'step' : undefined}
            className={`relative flex flex-col items-center gap-1.5 text-center text-[11px] sm:text-xs leading-tight ${
              finished || current ? 'text-[#22306a]' : 'text-gray-500'
            } ${current ? 'font-bold' : finished ? 'font-semibold' : 'font-medium'}`}
          >
            {/* The line to the next step */}
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className={`absolute top-[13px] left-1/2 w-full h-[3px] ${index < done - 1 ? 'bg-[#22306a]' : 'bg-[#e3e7ef]'}`} />
            )}
            <span
              aria-hidden="true"
              className={`relative z-[1] w-7 h-7 rounded-full flex items-center justify-center ${
                finished ? 'bg-[#22306a] text-white' : current ? 'bg-white border-[3px] border-[#22306a]' : 'bg-[#e3e7ef]'
              }`}
            >
              {finished && <i className="bx bx-check text-lg"></i>}
            </span>
            <span className="px-0.5">{step}</span>
            <span className="sr-only">{finished ? '(done)' : current ? '(now)' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

// One order for the customer, as a receipt: status and progress, the items, what was paid and what is left,
// and how they get it. Phones: slides up from the bottom. Wider screens: a pop-up in the middle.
export default function OrderDetailsModal({ orderId, onClose, onCancel }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useEscapeKey(true, requestClose)
  useBodyScrollLock()
  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error

  useEffect(() => {
    let cancelled = false
    getOrderDetails(orderId)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', message: error.message || 'Failed to load order details' })
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const data = state.status === 'ready' ? state.data : null
  const status = data?.order.status
  const look = data ? orderStatus(status) : null
  const cancelledOrder = status === 'cancelled'
  const delivery = data?.order.delivery ?? null

  // Orders are paid with a 30% downpayment; the shop records the balance when the order is completed
  const paid = data ? Number(data.payment.amount || 0) : 0
  const balancePayment = data?.balance_payment ?? null
  const balance = data ? Number(data.balance ?? Math.max(0, Number(data.total) - paid)) : 0
  const isDownpayment = data ? paid < Number(data.total) : false

  return (
    <div id="orderDetailsModal" className="fixed inset-0 z-[9999]">
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`} onClick={requestClose}></div>

      {/* Phones: a sheet from the bottom. From 640px: in the middle. Never taller than the screen (the middle scrolls). */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          id="orderDetailsModalContent"
          role="dialog"
          aria-modal="true"
          aria-labelledby="orderDetailsTitle"
          className={`pointer-events-auto flex flex-col bg-white w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
            shown ? 'translate-y-0 sm:scale-100 opacity-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
          }`}
        >
          {/* Header: order number, status, date */}
          <div className="flex-shrink-0 px-5 sm:px-7 pt-2.5 sm:pt-6 pb-4 border-b border-gray-100">
            <div aria-hidden="true" className="sm:hidden w-10 h-1 rounded-full bg-[#d8dce8] mx-auto mb-3"></div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h2 id="orderDetailsTitle" className="font-['Playfair_Display',serif] text-[1.4rem] sm:text-[1.65rem] font-bold text-[#22306a] leading-tight">
                    {data ? `Order #${data.order.id}` : 'Order Details'}
                  </h2>
                  {look && (
                    <span id="orderStatusBadge" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${look.badge}`}>
                      {look.label}
                    </span>
                  )}
                </div>
                <p id="orderDetailsDate" className="mt-1 text-sm text-gray-600">
                  {data ? `Ordered ${dateTime(data.order.date_ordered)}` : 'Loading...'}
                </p>
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close"
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#f3f5f9] text-gray-700 flex items-center justify-center transition-colors [@media(hover:hover)]:hover:bg-[#e6eaf2]"
              >
                <i className="bx bx-x text-2xl" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 space-y-5">
            {state.status === 'loading' && (
              <div id="orderDetailsLoading" className="text-center py-8" role="status">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22306a] mx-auto mb-3"></div>
                <p className="text-gray-500 text-sm">Loading order details...</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className="text-center py-10" role="alert">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="bx bx-error text-2xl text-red-600" aria-hidden="true"></i>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Error Loading Order</h3>
                <p className="text-gray-600 text-sm">{state.message}</p>
              </div>
            )}

            {data && (
              <div id="orderDetailsContent" className="space-y-5">
                {/* Where the order is */}
                {cancelledOrder ? (
                  <p className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-800">
                    <i className="bx bx-x-circle text-lg" aria-hidden="true"></i>
                    This order was cancelled{data.order.date_completed ? ` on ${shortDate(data.order.date_completed)}` : ''}.
                  </p>
                ) : (
                  <Progress status={status} />
                )}

                {/* The items */}
                <ul id="orderProducts" className="space-y-3" aria-label="Items">
                  {data.products.map((product) => (
                    <li key={product.id} className="flex items-center gap-3.5">
                      <ProductThumb product={product} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 leading-snug break-words">{product.name}</p>
                        <p className="text-[13px] text-gray-600">
                          Qty {product.quantity} · {money(product.price)} each
                          {product.type === 'custom' && <span className="ml-1.5 inline-block rounded-full border border-blue-200 bg-blue-50 px-2 text-[11px] font-medium text-blue-700">Custom</span>}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 whitespace-nowrap">{money(product.total)}</p>
                    </li>
                  ))}
                </ul>

                {/* The money: total, what was paid, what is left */}
                <div id="paymentInfo" className="rounded-2xl border border-[#e9ecf3] px-4 py-3.5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Total</span>
                    <span id="orderTotal" className="font-bold text-gray-900 whitespace-nowrap">{money(data.total)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-gray-600 min-w-0">
                      {isDownpayment ? 'Downpayment paid' : 'Paid'}
                      <span className="block text-xs text-gray-500 [overflow-wrap:anywhere]">
                        {wallet(data.payment.service)} · Ref {data.payment.reference_number}
                        {data.payment.uploaded_at ? ` · ${shortDate(data.payment.uploaded_at)}` : ''}
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-700 whitespace-nowrap">{money(paid)}</span>
                  </div>
                  {balancePayment && (
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-gray-600 min-w-0">
                        Balance paid
                        <span className="block text-xs text-gray-500">
                          {wallet(balancePayment.service)}
                          {balancePayment.uploaded_at ? ` · ${shortDate(balancePayment.uploaded_at)}` : ''}
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-700 whitespace-nowrap">{money(balancePayment.amount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-[#eef0f5]" aria-hidden="true"></div>
                  {balance > 0 && !cancelledOrder ? (
                    <>
                      <div className="flex justify-between items-center gap-3">
                        <span className="font-bold text-[#22306a]">Balance to pay</span>
                        <span id="orderBalance" className="font-bold text-lg text-amber-700 whitespace-nowrap">{money(balance)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {delivery ? 'Pay it with the shipping fee, before we ship your order.' : 'Pay it when you pick up your order.'}
                      </p>
                    </>
                  ) : (
                    <div className="flex justify-between items-center gap-3">
                      <span className="font-bold text-[#22306a]">{cancelledOrder ? 'Nothing to pay' : 'Fully paid'}</span>
                      {!cancelledOrder && <i className="bx bx-check-circle text-xl text-emerald-600" aria-hidden="true"></i>}
                    </div>
                  )}
                </div>

                {/* How they get it */}
                <div id="orderFulfillment" className="flex items-start gap-3 rounded-2xl bg-[#f5f7fb] px-4 py-3.5 text-sm">
                  <i className={`bx ${delivery ? 'bx-package' : 'bx-store'} text-xl text-[#2474b6] mt-0.5`} aria-hidden="true"></i>
                  <div className="min-w-0">
                    <p className="font-bold text-[#22306a]">{delivery ? 'Delivery by courier' : 'Store pickup'}</p>
                    {delivery ? (
                      <div className="text-gray-700 leading-relaxed [overflow-wrap:anywhere]">
                        {addressLines(delivery).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                        {delivery.notes && <div className="text-gray-500">Landmark/notes: {delivery.notes}</div>}
                      </div>
                    ) : (
                      <p className="text-gray-600">{STORE}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer: always visible */}
          <div
            id="orderActions"
            className={`flex-shrink-0 grid gap-2.5 px-5 sm:px-7 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-gray-100 ${
              data?.can_cancel ? 'grid-cols-2 sm:flex sm:justify-between' : 'grid-cols-1 sm:flex sm:justify-end'
            }`}
          >
            {data?.can_cancel && (
              <button
                type="button"
                onClick={() => {
                  requestClose()
                  onCancel(data.order.id)
                }}
                className="min-h-11 px-4 sm:px-5 rounded-xl border border-red-200 bg-white text-red-600 font-semibold transition-colors [@media(hover:hover)]:hover:bg-red-50"
              >
                Cancel order
              </button>
            )}
            <button
              type="button"
              onClick={requestClose}
              className="min-h-11 px-6 sm:px-8 rounded-xl bg-[#22306a] text-white font-bold transition-colors [@media(hover:hover)]:hover:bg-[#1a2550]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
