import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import EwalletOptions from '../../components/payment/EwalletOptions'
import PaymentConfirmStep from '../../components/payment/PaymentConfirmStep'
import PaymentHeader from '../../components/payment/PaymentHeader'
import { useCart } from '../../hooks/useCart'
import { submitPayment } from '../../services/paymentService'
import { clearCheckout, readCheckout } from '../../utils/checkoutStorage'
import { downpaymentOf, formatMoney } from '../../utils/formatMoney'
import '../../styles/payment.css'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The checkout page (was payment/payment.html).
// Step 1: choose an e-wallet and review the order. Step 2: scan the QR code and confirm the payment.
export default function Checkout() {
  const navigate = useNavigate()
  const { loadCart } = useCart()
  const [{ items, fromCart, total }] = useState(readCheckout) // read once, when the page opens

  const [service, setService] = useState('gcash')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.length > 0 ? items.reduce((sum, item) => sum + item.price * item.qty, 0) : total
  const downpayment = downpaymentOf(subtotal)
  const balance = Math.max(0, subtotal - parseFloat(downpayment)) // paid at the store when the order is picked up

  const handleSubmit = async ({ mobile, reference, screenshot }) => {
    setError('')
    setSubmitting(true)
    try {
      // The old page showed its loading screen for 3 seconds before sending the form
      const [data] = await Promise.all([
        submitPayment({
          service,
          amount: downpayment,
          mobile,
          reference,
          screenshot,
          fromCart,
          // one entry per item: quantity 2 sends the product id twice (same as the old page)
          productIds: items.flatMap((item) => Array(item.qty).fill(item.id)),
        }),
        sleep(3000),
      ])

      if (!data.success) {
        setError(data.error || 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }

      clearCheckout()
      if (fromCart) await loadCart() // the server emptied the cart
      const params = new URLSearchParams({ amount: data.amount, mobile: data.mobile, reference: data.reference })
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

  return (
    <div className="payment-page">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <PaymentHeader
          title="Payment Confirmation"
          subtitle="Complete your order with secure e-wallet payment"
          step={items.length === 0 && subtotal === 0 ? undefined : step}
        />

        {items.length === 0 && subtotal === 0 ? (
          // Opened directly, or the order was already paid
          <div className="pay-card p-8 max-sm:p-6 text-center">
            <h3 className="pay-title text-xl mb-2">Nothing to check out</h3>
            <p className="pay-muted mb-6">Add something to your cart or choose Buy Now on a product first.</p>
            <Link to="/shop" className="pay-btn">
              Go to the Shop
            </Link>
          </div>
        ) : step === 1 ? (
          <div id="step1" className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 items-start">
            {/* E-wallet selection (left) */}
            <div className="lg:col-span-2">
              <EwalletOptions value={service} onChange={setService} />
            </div>

            {/* Order Summary (right) */}
            <div className="lg:col-span-3 pay-card p-6 sm:p-7">
              <h3 className="pay-title text-xl mb-5">Order Summary</h3>
              <div id="orderSummaryItems" className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center gap-3.5">
                    <img src={item.image} alt={item.name} className="w-12 h-12 flex-shrink-0 object-cover rounded-lg border border-[#e9ecf3]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#22306a] break-words leading-snug">{item.name}</div>
                      <div className="text-xs pay-muted mt-0.5">Qty: {item.qty}</div>
                      {/* Phones: price under the name, so the name is not squeezed into a narrow strip */}
                      <div className="sm:hidden mt-1 font-semibold text-[#22306a]">₱{formatMoney(item.price * item.qty)}</div>
                    </div>
                    <div className="hidden sm:block font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-4 mt-5 border-t border-[#e9ecf3] text-sm sm:text-base">
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Subtotal</span>
                  <span id="summarySubtotal" className="font-semibold text-[#22306a] whitespace-nowrap">
                    ₱{formatMoney(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Downpayment</span>
                  <span className="font-semibold text-[#2474b6]">30%</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Balance at pickup</span>
                  <span id="summaryBalance" className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(balance)}</span>
                </div>
              </div>

              {/* What is paid now: the 30% downpayment (the rest is paid at the store, see "Balance at pickup").
                  When the label and the amount do not fit side by side (small phones, large text), the amount moves
                  to its own line, on the right */}
              <div className="pay-panel flex flex-wrap justify-between items-center gap-x-4 gap-y-1 px-4 py-3.5 mt-4">
                <div className="min-w-0">
                  <span className="text-lg font-bold text-[#22306a] whitespace-nowrap">Amount to Pay</span>
                  <p className="text-xs sm:text-sm pay-muted">(30% downpayment)</p>
                </div>
                <span id="summaryTotal" className="ml-auto text-xl min-[360px]:text-2xl font-bold text-[#22306a] whitespace-nowrap">
                  ₱{formatMoney(downpayment)}
                </span>
              </div>
              <p className="mt-2 text-xs pay-muted">E-wallet fees might apply.</p>

              <button id="continueBtn" onClick={() => goToStep(2)} className="pay-btn w-full mt-5">
                Continue to Payment
              </button>
            </div>
          </div>
        ) : (
          <PaymentConfirmStep
            amount={downpayment}
            onSubmit={handleSubmit}
            onBack={() => goToStep(1)}
            error={error}
            submitting={submitting}
          />
        )}
      </div>

      {submitting && <LoadingOverlay />}
    </div>
  )
}
