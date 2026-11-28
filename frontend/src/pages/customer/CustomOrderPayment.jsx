import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import DeliveryChoice from '../../components/payment/DeliveryChoice'
import InstapayInfo from '../../components/payment/InstapayInfo'
import PaymentConfirmStep from '../../components/payment/PaymentConfirmStep'
import PaymentHeader from '../../components/payment/PaymentHeader'
import { useCustomOrder } from '../../hooks/useCustomOrder'
import { useDelivery } from '../../hooks/useDelivery'
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

  const delivery = useDelivery() // store pickup or delivery by courier, kept while going to step 2 and back
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const downpayment = order ? order.downpayment.toFixed(2) : '0.00'
  const balance = order ? Math.max(0, order.price - order.downpayment) : 0 // paid at pickup, or before the order is shipped

  const handleSubmit = async ({ mobile, reference, screenshot }) => {
    setError('')
    setSubmitting(true)
    try {
      // The old page showed its loading screen for 3 seconds before sending the form
      const [data] = await Promise.all([
        submitPayment({
          amount: downpayment,
          mobile,
          reference,
          screenshot,
          fromCart: false,
          productIds: [order.id],
          quantities: [1],
          delivery: delivery.payload,
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

  // Change step and start at the top of the page (on phones the Continue button is far down)
  const goToStep = (next) => {
    setStep(next)
    window.scrollTo(0, 0)
  }

  return (
    <div className="payment-page">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <PaymentHeader
          title="Custom Order Payment"
          subtitle="Complete your custom order with a secure InstaPay payment"
          step={order && !alreadyPaid ? step : undefined}
        />

        {loading && <p className="pay-muted">Loading...</p>}

        {(loadError || alreadyPaid) && (
          <div id="customOrderNotice" className="pay-card p-8 max-sm:p-6 text-center">
            <h3 className="pay-title text-xl mb-2">{loadError || 'This custom order has already been paid.'}</h3>
            <p className="pay-muted mb-6">
              {loadError ? 'Please check the link in your email.' : 'You can follow it in your Order History.'}
            </p>
            <Link to="/shop" className="pay-btn">
              Go to the Shop
            </Link>
          </div>
        )}

        {order && !alreadyPaid && step === 1 && (
          <div id="step1" className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 items-start">
            {/* Pickup or delivery, then how they will pay (left) */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              <DeliveryChoice delivery={delivery} />
              <InstapayInfo />
            </div>

            {/* Custom Order Summary (right) */}
            <div className="lg:col-span-3 pay-card p-6 sm:p-7">
              <h3 className="pay-title text-xl mb-5">Custom Order Summary</h3>

              {/* The item */}
              <div className="flex items-center gap-3.5">
                {order.image ? (
                  <img src={`/uploads/custom/${order.image}`} alt={order.name} className="w-14 h-14 flex-shrink-0 object-cover rounded-lg border border-[#e9ecf3]" />
                ) : (
                  <div className="w-14 h-14 flex-shrink-0 bg-[#f5f6fa] rounded-lg border border-[#e9ecf3] flex items-center justify-center">
                    <span className="pay-muted text-xs">No Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#22306a] break-words leading-snug">{order.name}</div>
                  <div className="text-xs pay-muted mt-0.5">Custom Order</div>
                  {/* Phones: price under the name, so the name is not squeezed into a narrow strip */}
                  <div className="sm:hidden mt-1 font-semibold text-[#22306a]">₱{formatMoney(order.price)}</div>
                </div>
                <div className="hidden sm:block font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(order.price)}</div>
              </div>

              {/* Customer details and description: stacked on phones, side by side on wide screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="pay-panel p-3.5">
                  <h4 className="font-semibold text-[#22306a] mb-1.5">Customer Details</h4>
                  <div className="pay-muted space-y-0.5 [overflow-wrap:anywhere]">
                    <div>
                      <span className="font-medium text-[#22306a]">Name:</span> {order.customerName}
                    </div>
                    <div>
                      <span className="font-medium text-[#22306a]">Email:</span> {order.email}
                    </div>
                    {order.phone && (
                      <div id="customPhone">
                        <span className="font-medium text-[#22306a]">Phone:</span> {order.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pay-panel p-3.5">
                  <h4 className="font-semibold text-[#22306a] mb-1.5">Custom Description</h4>
                  <div className="pay-muted whitespace-pre-line [overflow-wrap:anywhere]">{order.description}</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 mt-4 border-t border-[#e9ecf3] text-sm sm:text-base">
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Total Amount</span>
                  <span id="customTotal" className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(order.price)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Downpayment</span>
                  <span className="font-semibold text-[#2474b6]">30%</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="pay-muted">Balance to pay later</span>
                  <span id="customBalance" className="font-semibold text-[#22306a] whitespace-nowrap">₱{formatMoney(balance)}</span>
                </div>
                <p className="text-xs pay-muted -mt-1">
                  {delivery.fulfillment === 'delivery' ? 'Paid with the shipping fee, before we ship your order.' : 'Paid when you pick up your order.'}
                </p>
                <div className="flex justify-between items-start gap-4">
                  <span className="pay-muted">{delivery.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                  <span id="summaryFulfillment" className="font-semibold text-[#22306a] text-right">
                    {delivery.fulfillment === 'delivery' ? 'By courier, fee added later' : 'At our CDO store'}
                  </span>
                </div>
              </div>

              <div className="pay-panel flex flex-wrap justify-between items-center gap-x-4 gap-y-1 px-4 py-3.5 mt-4">
                <div>
                  <span className="text-lg font-bold text-[#22306a] whitespace-nowrap">Amount to Pay</span>
                  <p className="text-xs sm:text-sm pay-muted">(30% downpayment)</p>
                </div>
                <span id="customDownpayment" className="ml-auto text-xl min-[360px]:text-2xl font-bold text-[#22306a] whitespace-nowrap">₱{formatMoney(downpayment)}</span>
              </div>

              <button id="continueBtn" onClick={() => delivery.check() && goToStep(2)} className="pay-btn w-full mt-5">
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {order && !alreadyPaid && step === 2 && (
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
