import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import EwalletOptions from '../../components/payment/EwalletOptions'
import PaymentConfirmStep from '../../components/payment/PaymentConfirmStep'
import { useCustomOrder } from '../../hooks/useCustomOrder'
import { submitPayment } from '../../services/paymentService'
import { formatMoney } from '../../utils/formatMoney'
import '../../styles/payment.css'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// "Custom Order Payment" (was payment-form.php). Same two steps as the Checkout page,
// with the custom order's details in the summary and a 30% downpayment of its price.
export default function CustomOrderPayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { order, error: loadError, loading } = useCustomOrder(id)

  const [service, setService] = useState('gcash')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const downpayment = order ? order.downpayment.toFixed(2) : '0.00'

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
          fromCart: false,
          productIds: [order.id],
          quantities: [1],
        }),
        sleep(3000),
      ])
      if (!data.success) {
        setError(data.error || 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }
      const params = new URLSearchParams({ amount: data.amount, mobile: data.mobile, reference: data.reference })
      navigate(`/payment-success?${params}`, { replace: true })
    } catch {
      setError('Could not reach the server. Please try again.')
      setSubmitting(false)
    }
  }

  const alreadyPaid = order && order.stock <= 0

  return (
    <div className="payment-page bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 xl:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Custom Order Payment</h1>
          <p className="text-gray-600">Complete your custom order with secure e-wallet payment</p>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {(loadError || alreadyPaid) && (
          <div id="customOrderNotice" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {loadError || 'This custom order has already been paid.'}
            </h3>
            <p className="text-gray-600 mb-6">
              {loadError ? 'Please check the link in your email.' : 'You can follow it in your Order History.'}
            </p>
            <Link
              to="/shop"
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Go to the Shop
            </Link>
          </div>
        )}

        {order && !alreadyPaid && step === 1 && (
          <div id="step1" className="flex flex-col xl:flex-row xl:items-start gap-6 sm:gap-8">
            {/* E-wallet selection (left) */}
            <div className="xl:w-2/5 w-full">
              <EwalletOptions value={service} onChange={setService} />
            </div>

            {/* Custom Order Summary (right). Same card, spacing and row style as "Choose E-wallet". */}
            <div className="xl:w-3/5 w-full">
              <div className="bg-white rounded-2xl p-8 max-sm:p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800">Custom Order Summary</h3>

                <div className="space-y-4">
                  {/* The item, as a bordered row like the e-wallet options */}
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200">
                    {order.image ? (
                      <img src={`/uploads/custom/${order.image}`} alt={order.name} className="w-14 h-14 flex-shrink-0 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 break-words">{order.name}</div>
                      <div className="text-sm text-gray-500">Custom Order</div>
                      {/* Phones: price under the name, so the name is not squeezed into a narrow strip */}
                      <div className="sm:hidden mt-1 font-semibold text-gray-700">₱{formatMoney(order.price)}</div>
                    </div>
                    <div className="hidden sm:block font-semibold text-gray-700 whitespace-nowrap">₱{formatMoney(order.price)}</div>
                  </div>

                  {/* Customer details and description: stacked on phones, side by side on wide screens */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-700 mb-2">Customer Details</h4>
                      <div className="text-sm text-gray-600 space-y-1 break-words">
                        <div>
                          <strong>Name:</strong> {order.customerName}
                        </div>
                        <div>
                          <strong>Email:</strong> {order.email}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-blue-700 mb-2">Custom Description</h4>
                      <div className="text-sm text-blue-600 whitespace-pre-line break-words">{order.description}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-5 mt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-medium text-gray-700">Total Amount</span>
                    <span id="customTotal" className="font-semibold text-gray-800">₱{formatMoney(order.price)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-medium text-gray-700">Downpayment</span>
                    <span className="font-semibold text-blue-600">30%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200 mt-4">
                  <div>
                    <span className="text-lg font-bold text-gray-800">Amount to Pay</span>
                    <p className="text-sm text-gray-500 whitespace-nowrap">(30% downpayment)</p>
                  </div>
                  <span id="customDownpayment" className="text-2xl font-bold text-blue-600 whitespace-nowrap">₱{formatMoney(downpayment)}</span>
                </div>
                <button
                  id="continueBtn"
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {order && !alreadyPaid && step === 2 && (
          <PaymentConfirmStep amount={downpayment} onSubmit={handleSubmit} error={error} submitting={submitting} />
        )}
      </div>

      {submitting && <LoadingOverlay />}
    </div>
  )
}
