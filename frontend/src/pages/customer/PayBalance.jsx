import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import EwalletOptions from '../../components/payment/EwalletOptions'
import PaymentConfirmStep from '../../components/payment/PaymentConfirmStep'
import PaymentHeader from '../../components/payment/PaymentHeader'
import { getOrderDetails, payBalance } from '../../services/orderService'
import { addressLines } from '../../utils/address'
import { formatMoney } from '../../utils/formatMoney'
import { orderIdFromRef, orderRef } from '../../utils/orderRef'
import '../../styles/payment.css'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const ORDERS = '/profile?tab=orders'

// "Pay for Your Order" (/orders/LCJ-0951/pay): a delivery order that is ready to ship, paid online.
// The customer pays what is left (the balance plus the shipping fee the shop set) with GCash, PayMaya or GoTyme.
// Same two steps as the Custom Order Payment page: 1. the e-wallet and the order summary, 2. the QR code and the
// payment form (PaymentConfirmStep). The shop then checks the payment and ships the order.
// Linked from the "ready to ship" email and from the Pay button in Order Details.
export default function PayBalance() {
  const { ref } = useParams()
  const orderId = orderIdFromRef(ref)
  const navigate = useNavigate()

  const [state, setState] = useState(orderId ? { status: 'loading' } : { status: 'error', message: 'We could not find this order.' })
  const [service, setService] = useState('gcash')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    getOrderDetails(orderId)
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch(() => !cancelled && setState({ status: 'error', message: 'We could not find this order.' }))
    return () => {
      cancelled = true
    }
  }, [orderId])

  const data = state.status === 'ready' ? state.data : null
  const amount = data ? Number(data.balance) : 0
  const fee = data ? Number(data.shipping_fee ?? 0) : 0
  const downpayment = data ? Number(data.payment?.amount ?? 0) : 0

  // Why it cannot be paid here, when it cannot
  let notice = state.status === 'error' ? { title: state.message, text: 'Please check the link in your email.' } : null
  if (data && !data.can_pay) {
    if (data.balance_submitted) notice = { title: 'You already paid for this order.', text: "We're checking your payment. You'll get an email with the tracking number when your order ships." }
    else if (Number(data.balance) <= 0) notice = { title: 'This order is fully paid.', text: 'You can follow it in your Order History.' }
    else notice = { title: "This order can't be paid online right now.", text: "We'll email you when it is ready to ship, with the amount to pay." }
  }

  const handleSubmit = async ({ mobile, reference, screenshot }) => {
    setError('')
    setSubmitting(true)
    try {
      // Same 3-second loading screen as the other payment pages
      const [res] = await Promise.all([payBalance({ orderId, service, mobile, reference, screenshot }), sleep(3000)])
      if (!res.success) {
        setError(res.error || 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }
      const params = new URLSearchParams({ amount: res.amount, mobile, reference })
      navigate(`/payment-success?${params}`, { replace: true })
    } catch {
      setError('Could not reach the server. Please try again.')
      setSubmitting(false)
    }
  }

  // Change step and start at the top of the page (on phones the Continue button is far down)
  const goToStep = (next) => {
    setStep(next)
    window.scrollTo(0, 0)
  }

  const ready = data && data.can_pay

  return (
    <div className="payment-page">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <PaymentHeader
          title="Pay for Your Order"
          subtitle={data ? `Balance and shipping fee for ${orderRef(data.order.id)}` : 'Balance and shipping fee'}
          step={ready ? step : undefined}
          steps={['E-wallet', 'Pay & confirm']}
        />

        {state.status === 'loading' && <p className="pay-muted">Loading...</p>}

        {notice && (
          <div id="payBalanceNotice" className="pay-card p-8 max-sm:p-6 text-center">
            <h3 className="pay-title text-xl mb-2">{notice.title}</h3>
            <p className="pay-muted mb-6">{notice.text}</p>
            <Link to={ORDERS} className="pay-btn">
              Go to My Orders
            </Link>
          </div>
        )}

        {ready && step === 1 && (
          <div id="step1" className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 items-start">
            {/* The e-wallet (left) */}
            <div className="lg:col-span-2">
              <EwalletOptions value={service} onChange={setService} />
            </div>

            {/* Order Summary (right) */}
            <div className="lg:col-span-3 pay-card p-6 sm:p-7">
              <h3 className="pay-title text-xl mb-5">Order Summary</h3>

              <ul className="space-y-3" aria-label="Items">
                {data.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3.5">
                    {p.image ? (
                      <img
                        src={`/uploads/${p.type === 'custom' ? 'custom' : 'products'}/${p.image}`}
                        alt=""
                        className="w-14 h-14 flex-shrink-0 object-cover rounded-lg border border-[#e9ecf3]"
                      />
                    ) : (
                      <div className="w-14 h-14 flex-shrink-0 bg-[#f5f6fa] rounded-lg border border-[#e9ecf3]" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#22306a] break-words leading-snug">{p.name}</div>
                      <div className="text-xs pay-muted mt-0.5">
                        Qty {p.quantity} · ₱{formatMoney(p.price)}
                      </div>
                    </div>
                    <div className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(p.total)}</div>
                  </li>
                ))}
              </ul>

              {data.order.delivery && (
                <p id="payShipsTo" className="pay-panel mt-4 px-3.5 py-3 text-sm pay-muted [overflow-wrap:anywhere]">
                  <span className="font-semibold text-[#22306a]">Ships to</span> {[data.order.delivery.name, ...addressLines(data.order.delivery).slice(1)].join(', ')}
                </p>
              )}

              <div className="space-y-2.5 pt-4 mt-4 border-t border-[#e9ecf3] text-sm sm:text-base">
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Items</span>
                  <span className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(data.items_total)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Shipping fee</span>
                  <span id="payShippingFee" className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(fee)}</span>
                </div>
                {downpayment > 0 && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="pay-muted">Downpayment paid</span>
                    <span className="font-semibold text-emerald-700 whitespace-nowrap">−₱{formatMoney(downpayment)}</span>
                  </div>
                )}
              </div>

              <div className="pay-panel flex flex-wrap justify-between items-center gap-x-4 gap-y-1 px-4 py-3.5 mt-4">
                <div>
                  <span className="text-lg font-bold text-[#22306a] whitespace-nowrap">Amount to Pay</span>
                  <p className="text-xs sm:text-sm pay-muted">(balance + shipping fee)</p>
                </div>
                <span id="payAmount" className="ml-auto text-xl min-[360px]:text-2xl font-bold text-[#22306a] whitespace-nowrap">₱{formatMoney(amount)}</span>
              </div>
              <p className="text-xs pay-muted mt-3">We check your payment, then ship your order and email you the tracking number.</p>

              <button id="continueBtn" onClick={() => goToStep(2)} className="pay-btn w-full mt-5">
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {ready && step === 2 && (
          <PaymentConfirmStep amount={amount.toFixed(2)} onSubmit={handleSubmit} onBack={() => goToStep(1)} error={error} submitting={submitting} />
        )}
      </div>

      {submitting && <LoadingOverlay />}
    </div>
  )
}
