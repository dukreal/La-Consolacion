import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import EwalletOptions from '../../components/payment/EwalletOptions'
import PaymentConfirmStep from '../../components/payment/PaymentConfirmStep'
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

  return (
    <div className="payment-page bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Confirmation</h1>
          <p className="text-gray-600">Complete your order with secure e-wallet payment</p>
        </div>

        {items.length === 0 && subtotal === 0 ? (
          // Opened directly, or the order was already paid
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Nothing to check out</h3>
            <p className="text-gray-600 mb-6">Add something to your cart or choose Buy Now on a product first.</p>
            <Link to="/shop" className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200">
              Go to the Shop
            </Link>
          </div>
        ) : step === 1 ? (
          <div id="step1" className="flex flex-col xl:flex-row gap-8">
            {/* E-wallet selection (left) */}
            <div className="xl:w-2/5 w-full">
              <EwalletOptions value={service} onChange={setService} />
            </div>

            {/* Order Summary (right) */}
            <div className="xl:w-3/5 w-full">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800">Order Summary</h3>
                <div id="orderSummaryItems" className="mb-6 space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-3 mb-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded border" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        <div className="text-xs text-gray-500">Qty: {item.qty}</div>
                      </div>
                      <div className="font-semibold text-gray-700">₱{formatMoney(item.price * item.qty)}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span id="summarySubtotal" className="font-semibold text-gray-800">
                      Php {formatMoney(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Downpayment:</span>
                    <span className="font-semibold text-blue-600">30%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                  <div>
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <p className="text-sm text-gray-500">(fees might be applied)</p>
                  </div>
                  <span id="summaryTotal" className="text-2xl font-bold text-blue-600">
                    Php {formatMoney(downpayment)}
                  </span>
                </div>
                <button
                  id="continueBtn"
                  onClick={() => setStep(2)}
                  className="w-full mt-8 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        ) : (
          <PaymentConfirmStep amount={downpayment} onSubmit={handleSubmit} error={error} submitting={submitting} />
        )}
      </div>

      {submitting && <LoadingOverlay />}
    </div>
  )
}
