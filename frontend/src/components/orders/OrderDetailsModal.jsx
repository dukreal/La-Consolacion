import { useEffect, useState } from 'react'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { getOrderDetails } from '../../services/orderService'
import { orderStatus } from '../../utils/orderStatus'

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
          <i className="bx bx-diamond text-lg text-white"></i>
        </div>
      ) : (
        <img
          src={`/uploads/${product.type === 'custom' ? 'custom' : 'products'}/${product.image}`}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// One line of the "Payment Information" box. The value wraps under itself on narrow screens
// instead of squeezing the label onto two lines.
function PaymentRow({ iconBox, icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 lg:py-2 lg:[@media(max-height:700px)]:py-1.5">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconBox}`}>
          <i className={`bx ${icon} text-base`}></i>
        </div>
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{label}</span>
      </div>
      <div className="min-w-0 text-right break-words">{children}</div>
    </div>
  )
}

// Everything about one order: status, payment, products.
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

  const itemCount = data ? data.products.reduce((sum, p) => sum + Number(p.quantity), 0) : 0
  // Orders are paid with a 30% downpayment; the rest is paid at pickup (the shop records it when the order is completed)
  const balancePayment = data?.balance_payment ?? null
  const balance = data ? Number(data.balance ?? Math.max(0, Number(data.total) - Number(data.payment.amount || 0))) : 0
  const isDownpayment = data ? Number(data.payment.amount || 0) < Number(data.total) : false

  return (
    <div id="orderDetailsModal" className="fixed inset-0 z-[9999]">
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={requestClose}></div>

      {/* Modal Content: as tall as its content, never taller than the screen (the middle part scrolls) */}
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          id="orderDetailsModalContent"
          role="dialog"
          aria-modal="true"
          aria-labelledby="orderDetailsTitle"
          className={`flex flex-col bg-white rounded-2xl shadow-2xl w-full max-w-md lg:max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden transform transition-all duration-300 pointer-events-auto ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          {/* Header */}
          <div className="relative flex-shrink-0 px-5 py-4 sm:px-6 sm:py-5 lg:[@media(max-height:700px)]:py-3 bg-[#22306a] text-white overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 translate-x-12"></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="orderDetailsTitle" className="playfair text-xl sm:text-2xl font-semibold mb-1">
                  {data ? `Order #${data.order.id}` : 'Order Details'}
                </h2>
                <p id="orderDetailsDate" className="inter text-sm text-white/80">
                  {data ? `Ordered on ${formatDate(data.order.date_ordered)}` : 'Loading...'}
                </p>
              </div>
              <button
                onClick={requestClose}
                aria-label="Close"
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-xl transition-all duration-300"
              >
                <i className="bx bx-x text-3xl sm:text-4xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:py-5 lg:[@media(max-height:700px)]:py-4">
            {state.status === 'loading' && (
              <div id="orderDetailsLoading" className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22306a] mx-auto mb-4"></div>
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
              /* Phones and tablets: status, products, payment (one column).
                 Desktop: status and payment on the left, products on the right. */
              <div id="orderDetailsContent" className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start">
                <div className="contents lg:block lg:space-y-4">
                  {/* Order Status */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="text-base font-semibold text-gray-900">Order Status</h3>
                      <div
                        id="orderStatusBadge"
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${orderStatus(data.order.status).badge}`}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 ${orderStatus(data.order.status).dot}`}></span>
                        {orderStatus(data.order.status).label}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Items</p>
                        <p id="orderItemCount" className="font-semibold text-gray-900 text-sm">{itemCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Amount</p>
                        <p id="orderTotal" className="font-semibold text-gray-900 text-sm">{money(data.total)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information (after the products on phones and tablets) */}
                  <div className="order-last lg:order-none bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div id="paymentInfo" className="space-y-2.5 lg:space-y-2">
                      <PaymentRow iconBox="bg-blue-100 text-blue-600" icon="bx-credit-card" label="Method">
                        <span className="font-medium text-blue-700 text-sm">{(data.payment.service || '').toUpperCase()}</span>
                      </PaymentRow>
                      <PaymentRow iconBox="bg-green-100 text-green-600" icon="bx-hash" label="Reference No.">
                        <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-1 rounded break-all">{data.payment.reference_number}</span>
                      </PaymentRow>
                      <PaymentRow iconBox="bg-purple-100 text-purple-600" icon="bx-money" label={isDownpayment ? 'Downpayment' : 'Amount Paid'}>
                        <span className="font-bold text-purple-700 text-sm">{money(data.payment.amount)}</span>
                      </PaymentRow>
                      {balancePayment ? (
                        <PaymentRow iconBox="bg-emerald-100 text-emerald-600" icon="bx-check-circle" label="Balance Paid">
                          <span className="font-bold text-emerald-700 text-sm text-right">
                            <span className="whitespace-nowrap">{money(balancePayment.amount)}</span> · {balancePayment.service}
                          </span>
                        </PaymentRow>
                      ) : (
                        balance > 0 && (
                          <PaymentRow iconBox="bg-orange-100 text-orange-600" icon="bx-wallet" label="Due at pickup">
                            <span className="font-bold text-orange-700 text-sm whitespace-nowrap">{money(balance)}</span>
                          </PaymentRow>
                        )
                      )}
                      <PaymentRow iconBox="bg-amber-100 text-amber-600" icon="bx-calendar" label="Paid On">
                        <span className="text-gray-900 text-sm">{data.payment.uploaded_at ? formatDate(data.payment.uploaded_at) : '-'}</span>
                      </PaymentRow>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Products</h3>
                  <div id="orderProducts" className="space-y-3 lg:max-h-[50vh] lg:overflow-y-auto">
                    {data.products.map((product) => (
                      <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb product={product} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                            {product.type === 'custom' && (
                              <span className="mt-0.5 inline-block rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Custom Order</span>
                            )}
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Qty: {product.quantity}</span>
                                <span className="mx-1">•</span>
                                <span className="font-medium">{money(product.price)}</span>
                              </div>
                              <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{money(product.total)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer: the cancel button always stays visible at the bottom */}
          {data && data.can_cancel && (
            <div id="orderActions" className="flex-shrink-0 flex justify-end p-4 sm:px-6 lg:py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  requestClose()
                  onCancel(data.order.id)
                }}
                className="w-full sm:w-auto px-6 py-3 lg:py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-300"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
