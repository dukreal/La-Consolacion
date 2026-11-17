import { useEffect, useState } from 'react'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { getOrderDetails } from '../../services/orderService'

// 1500 -> "₱1,500.00"
const money = (amount) => `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

// MySQL sends "2026-11-04 10:30:00"; the "T" makes every browser (including Safari) read it.
function formatDate(value) {
  return new Date(value.replace(' ', 'T')).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Product picture, with a gem icon when the file is missing
function ProductThumb({ product }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {failed ? (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
          <i className="bx bx-gem text-lg text-white"></i>
        </div>
      ) : (
        <img
          src={`/uploads/products/${product.image}`}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// One line of the "Payment Information" box
function PaymentRow({ iconBox, icon, label, children }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${iconBox}`}>
            <i className={`bx ${icon} text-sm`}></i>
          </div>
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

// Everything about one order: status, payment, products.
export default function OrderDetailsModal({ orderId, onClose, onCancel }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
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

  return (
    <div id="orderDetailsModal" className="fixed inset-0 z-[9999]">
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={requestClose}></div>

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          id="orderDetailsModalContent"
          className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 h-[90vh] transform transition-all duration-300 pointer-events-auto ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 translate-x-12"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 id="orderDetailsTitle" className="playfair text-2xl font-semibold mb-1">
                  {data ? `Order #${data.order.id}` : 'Order Details'}
                </h2>
                <p id="orderDetailsDate" className="inter text-sm text-white/80">
                  {data ? `Ordered on ${formatDate(data.order.date_ordered)}` : 'Loading...'}
                </p>
              </div>
              <button onClick={requestClose} className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110">
                <i className="bx bx-x text-4xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {state.status === 'loading' && (
              <div id="orderDetailsLoading" className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading order details...</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-error text-3xl text-red-600"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Order</h3>
                <p className="text-gray-600 mb-6">{state.message}</p>
                <button
                  onClick={requestClose}
                  className="px-6 py-3 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            )}

            {data && (
              <div id="orderDetailsContent">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Order Status */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900">Order Status</h3>
                        <div
                          id="orderStatusBadge"
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data.order.status_style.bg} ${data.order.status_style.text}`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${data.order.status_style.dot}`}></span>
                          {data.order.status_style.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Order ID</p>
                          <p id="orderId" className="font-semibold text-gray-900 text-sm">{data.order.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Amount</p>
                          <p id="orderTotal" className="font-semibold text-gray-900 text-sm">{money(data.total)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Information</h3>
                      <div id="paymentInfo" className="space-y-3">
                        <PaymentRow iconBox="bg-blue-100 text-blue-600" icon="bx-credit-card" label="Payment Method">
                          <span className="font-medium text-blue-700 text-sm">{(data.payment.service || '').toUpperCase()}</span>
                        </PaymentRow>
                        <PaymentRow iconBox="bg-green-100 text-green-600" icon="bx-hash" label="Reference Number">
                          <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{data.payment.reference_number}</span>
                        </PaymentRow>
                        <PaymentRow iconBox="bg-purple-100 text-purple-600" icon="bx-money" label="Amount Paid">
                          <span className="font-bold text-purple-700 text-sm">{money(data.payment.amount)}</span>
                        </PaymentRow>
                        <PaymentRow iconBox="bg-amber-100 text-amber-600" icon="bx-calendar" label="Payment Date">
                          <span className="text-gray-900 text-sm">{data.payment.uploaded_at}</span>
                        </PaymentRow>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div id="orderActions" className="flex justify-end space-x-3 pt-4">
                      {data.can_cancel && (
                        <button
                          onClick={() => {
                            requestClose()
                            onCancel(data.order.id)
                          }}
                          className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-300"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Products */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Products</h3>
                      <div id="orderProducts" className="space-y-3 max-h-96 overflow-y-auto">
                        {data.products.map((product) => (
                          <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <ProductThumb product={product} />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Qty: {product.quantity}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-medium">{money(product.price)}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900 text-sm">{money(product.total)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
