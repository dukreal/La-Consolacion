import { AlertCircle, AlertTriangle, Banknote, CreditCard, X, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPaymentDetails } from '../../services/adminService'

// The balance box when money is still owed, for orders that are already closed (title, small text)
const BALANCE_TEXT = {
  completed: ['Balance not recorded', 'This order was completed before balances were recorded.'],
  cancelled: ['Balance not collected', 'This order was cancelled.'],
}

const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })

// "2026-11-19 10:00:00" -> "Nov 19, 2026 · 10:00 AM" (anything else, like "Waiting", is shown as is)
const formatDateTime = (value) => {
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return value
  const day = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  return `${day} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

// One detail: a small grey label with the value under it
function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 break-words">{children}</dd>
    </div>
  )
}

// The proof of payment. It shrinks to fit the space it is given (never taller than the pop-up), tap to enlarge.
function Screenshot({ payment, onEnlarge }) {
  if (payment.imageUrl) {
    return (
      <button
        type="button"
        onClick={onEnlarge}
        aria-label="Enlarge payment screenshot"
        className="relative group w-full h-full min-h-0 flex items-center justify-center rounded-xl bg-[#f5f7fb] border border-gray-100 p-2 cursor-zoom-in outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25"
      >
        <img src={payment.imageUrl} alt="Payment Screenshot" className="payment-modal-image max-w-full max-h-full object-contain rounded-lg shadow-sm" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#22306a]/80 text-white text-[11px] font-medium">
          <ZoomIn className="w-3.5 h-3.5" />
          Enlarge
        </span>
      </button>
    )
  }
  // Walk-in sales are paid at the counter, so there is no screenshot (the old pop-up said "not yet paid")
  if (payment.isWalkIn) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center rounded-xl bg-[#f5f7fb] px-4 py-4 sm:py-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
          <Banknote className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Paid In Store</h3>
        <p className="text-gray-600 text-sm mt-1">Walk-in sales have no payment screenshot.</p>
      </div>
    )
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center rounded-xl bg-[#f5f7fb] px-4 py-4 sm:py-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
      </div>
      <h3 className="font-semibold text-gray-900">Customer Not Yet Paid</h3>
      <p className="text-gray-600 text-sm mt-1">No payment screenshot has been uploaded yet.</p>
      <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        Awaiting Payment
      </div>
    </div>
  )
}

// The "Payment Details" pop-up (opened by the Payment button on the Orders page).
// Never scrolls: with a screenshot the pop-up takes the screen's height (up to 40rem) and the picture shrinks to
// fit what is left. Phones: picture on top, details under it. From 640px (and phones on their side): picture on
// the left, details on the right. On short screens (phones under 680px tall, anything under 500px tall)
// the spacing tightens and the two small helper lines are hidden, so everything still fits.
export default function PaymentModal({ paymentId, onClose }) {
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState(null) // { title, message }
  const [enlarged, setEnlarged] = useState(false)

  useEffect(() => {
    getPaymentDetails(paymentId)
      .then((d) => {
        if (d.success) setPayment(d)
        else setError({ title: 'Payment Not Found', message: d.message || d.error || 'Payment details could not be loaded.' })
      })
      .catch(() => setError({ title: 'Error Loading Payment', message: 'Failed to load payment details. Please try again.' }))
  }, [paymentId])

  let content
  if (error) {
    content = (
      <div className="text-center py-8 px-5">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{error.title}</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  } else if (!payment) {
    content = (
      <div className="text-center py-8 px-5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2474b6] mx-auto mb-3" />
        <p className="text-gray-600">Loading payment details...</p>
      </div>
    )
  } else {
    const p = payment
    // Same "Waiting" rules as the old pop-up
    const reference = p.referenceNumber && p.referenceNumber !== `custom_${p.orderId}` ? p.referenceNumber : 'Waiting'
    const service = p.service && p.service.toUpperCase() !== 'CUSTOM' ? p.service.toUpperCase() : 'Waiting'
    // The old pop-up showed "Waiting" when the upload time equaled the order time, but a payment
    // and its order are saved in the same second, so the real date never showed. Now it always shows.
    const uploaded = p.uploadedAt ? formatDateTime(p.uploadedAt) : 'Waiting'
    // What is still owed (the server adds the balance payment once it is recorded at pickup)
    const balance = p.balance ?? Math.max(p.orderTotal - p.amount, 0)
    const bp = p.balancePayment

    content = (
      <div className={`flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 p-4 sm:p-5 [@media(max-height:500px)]:gap-3 [@media(max-height:500px)]:p-3 ${p.imageUrl ? 'grid-rows-[minmax(0,1fr)_auto] sm:grid-rows-1' : ''}`}>
        {/* Screenshot (or why there is none) */}
        <div className="min-h-0 flex">
          <Screenshot payment={p} onEnlarge={() => setEnlarged(true)} />
        </div>

        {/* Details and amounts */}
        <div className="flex flex-col gap-3 sm:gap-4 [@media(max-height:500px)]:gap-2 min-h-0 sm:justify-center">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:gap-y-3 [@media(max-height:500px)]:gap-y-1.5">
            <Detail label="Reference No.">
              <span id="paymentReference" className="font-mono text-[#22306a] font-semibold [overflow-wrap:anywhere]">{reference}</span>
            </Detail>
            <Detail label="Service">
              <span id="paymentService" className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#eef1f8] text-[#22306a]">{service}</span>
            </Detail>
            <Detail label="Uploaded">
              <span id="paymentUploaded">{uploaded}</span>
            </Detail>
            <Detail label="Mobile">
              <span id="paymentMobile" className="font-mono">{p.mobile || 'Waiting'}</span>
            </Detail>
          </dl>

          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
            <div className="flex items-center justify-between px-3 py-2 [@media(max-height:500px)]:py-1.5">
              <span className="text-gray-600">Order Total</span>
              <span id="paymentTotal" className="font-semibold text-gray-900">{peso(p.orderTotal)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 [@media(max-height:500px)]:py-1.5">
              <span className="text-gray-600">{p.amount < p.orderTotal ? 'Downpayment' : 'Amount Paid'}</span>
              <span id="paymentAmount" className="font-semibold text-gray-900">{peso(p.amount)}</span>
            </div>
            {/* The balance paid at pickup, recorded with Confirm Order → Completed */}
            {bp && (
              <div id="paymentBalanceRow" className="flex items-start justify-between gap-3 px-3 py-2 [@media(max-height:500px)]:py-1.5">
                <div className="min-w-0">
                  <div className="text-gray-600">Balance paid</div>
                  <div className="text-xs text-gray-500 [overflow-wrap:anywhere]">
                    {bp.service.toUpperCase()}
                    {bp.service.toUpperCase() !== 'CASH' && <> · Ref {bp.referenceNumber}</>} · {formatDateTime(bp.paidAt)}
                  </div>
                </div>
                <span className="font-semibold text-gray-900 whitespace-nowrap">{peso(bp.amount)}</span>
              </div>
            )}
          </div>

          {balance > 0 ? (
            <div className="rounded-xl bg-[#22306a] text-white px-4 py-3 [@media(max-height:500px)]:py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{BALANCE_TEXT[p.orderStatus]?.[0] ?? 'Remaining Balance'}</h3>
                <p className="text-xs text-white/75 leading-snug max-sm:[@media(max-height:680px)]:hidden [@media(max-height:500px)]:hidden">
                  {BALANCE_TEXT[p.orderStatus]?.[1] ?? 'To collect at pickup.'}
                </p>
              </div>
              <p id="paymentBalance" className="text-xl sm:text-2xl font-bold whitespace-nowrap">{peso(balance)}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-600 text-white px-4 py-3 [@media(max-height:500px)]:py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">Fully Paid</h3>
                <p className="text-xs text-white/80 leading-snug max-sm:[@media(max-height:680px)]:hidden [@media(max-height:500px)]:hidden">Nothing left to collect.</p>
              </div>
              <p id="paymentBalance" className="text-xl sm:text-2xl font-bold whitespace-nowrap">{peso(0)}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      id="paymentModal"
      className="fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] w-full max-w-4xl flex flex-col overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] ${
          payment?.imageUrl ? 'h-[calc(100dvh-1.5rem)] sm:h-[min(40rem,calc(100dvh-2rem))]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 [@media(max-height:500px)]:py-2 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 flex-shrink-0 bg-[#eef1f8] text-[#22306a] rounded-full flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-[#22306a] leading-tight">Payment Details</h2>
              <p className="hidden sm:block [@media(max-height:500px)]:hidden text-sm text-gray-500">Transaction information and proof of payment</p>
            </div>
          </div>
          <button
            type="button"
            id="closePaymentModal"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#f5f6fa] hover:text-[#22306a] transition-colors outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id="paymentDetailsContent" className="flex-1 min-h-0 flex flex-col">{content}</div>
      </div>

      {/* Full-size screenshot, always inside the screen; click anywhere to close */}
      {enlarged && (
        <div id="expandedImageModal" onClick={() => setEnlarged(false)} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <img
            id="expandedImage"
            src={payment.imageUrl}
            alt="Expanded Payment Screenshot"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white cursor-zoom-out"
          />
        </div>
      )}
    </div>
  )
}
