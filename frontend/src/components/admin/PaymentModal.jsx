import { AlertCircle, AlertTriangle, Banknote, Calendar, CreditCard, Hash, Phone, Smartphone, X, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPaymentDetails } from '../../services/adminService'

const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })

// One white box on the right side: a small colored icon, a title, and the value under it
function InfoCard({ icon: Icon, iconColors, title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColors}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Screenshot({ payment, onEnlarge }) {
  if (payment.imageUrl) {
    return (
      <div className="relative group">
        <img
          src={payment.imageUrl}
          alt="Payment Screenshot"
          onClick={onEnlarge}
          className="w-full rounded-lg shadow-lg border border-gray-200 cursor-zoom-in payment-modal-image"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>
    )
  }
  // Walk-in sales are paid at the counter, so there is no screenshot (the old pop-up said "not yet paid")
  if (payment.isWalkIn) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Paid In Store</h3>
        <p className="text-gray-600 text-sm">Walk-in sales have no payment screenshot.</p>
      </div>
    )
  }
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Not Yet Paid</h3>
      <p className="text-gray-600 text-sm">No payment screenshot has been uploaded yet.</p>
      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        Awaiting Payment
      </div>
    </div>
  )
}

// The "Payment Details" pop-up (opened by the Payment button on the Orders page).
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
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{error.title}</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  } else if (!payment) {
    content = (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
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
    const uploaded = p.uploadedAt || 'Waiting'
    const balance = Math.max(p.orderTotal - p.amount, 0)

    content = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: screenshot */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Screenshot</h3>
              {p.imageUrl && <p className="text-sm text-gray-600">Click to enlarge</p>}
            </div>
            <Screenshot payment={p} onEnlarge={() => setEnlarged(true)} />
          </div>
        </div>

        {/* Right: details and amounts */}
        <div className="space-y-4">
          <div className="space-y-3">
            <InfoCard icon={Hash} iconColors="bg-blue-100 text-blue-600" title="Reference Number" subtitle="Transaction ID">
              <p id="paymentReference" className="font-mono text-lg text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">{reference}</p>
            </InfoCard>
            <InfoCard icon={Smartphone} iconColors="bg-emerald-100 text-emerald-600" title="Payment Service" subtitle="Method used">
              <div className="flex items-center space-x-2">
                <span id="paymentService" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">{service}</span>
              </div>
            </InfoCard>
            <InfoCard icon={Calendar} iconColors="bg-amber-100 text-amber-600" title="Upload Date" subtitle="When received">
              <p id="paymentUploaded" className="text-gray-900 font-medium">{uploaded}</p>
            </InfoCard>
            <InfoCard icon={Phone} iconColors="bg-purple-100 text-purple-600" title="Mobile Number" subtitle="Contact info">
              <p id="paymentMobile" className="font-mono text-gray-900">{p.mobile || 'Waiting'}</p>
            </InfoCard>
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Remaining Balance</h3>
                  <p className="text-emerald-100 text-sm">This is the amount to be collected upon delivery/pickup.</p>
                </div>
                <div className="text-right">
                  <p id="paymentBalance" className="text-3xl font-bold">{peso(balance)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="font-semibold text-gray-900">Downpayment</div>
              <div id="paymentAmount" className="font-bold text-lg text-gray-900">{peso(p.amount)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="font-semibold text-gray-900">Order Total</div>
              <div id="paymentTotal" className="font-bold text-lg text-gray-900">{peso(p.orderTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id="paymentModal"
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                <p className="text-sm text-gray-600">Transaction information and proof of payment</p>
              </div>
            </div>
            <button type="button" id="closePaymentModal" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div id="paymentDetailsContent" className="space-y-6">{content}</div>
        </div>
      </div>

      {/* Full-size screenshot; click anywhere to close */}
      {enlarged && (
        <div id="expandedImageModal" onClick={() => setEnlarged(false)} className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <img id="expandedImage" src={payment.imageUrl} alt="Expanded Payment Screenshot" className="max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white cursor-zoom-out" />
        </div>
      )}
    </div>
  )
}
