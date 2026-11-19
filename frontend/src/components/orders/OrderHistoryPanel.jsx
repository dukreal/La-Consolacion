import { useEffect, useState } from 'react'
import MessageModal from '../common/MessageModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { getUserOrders } from '../../services/orderService'
import CancelOrderModal from './CancelOrderModal'
import OrderCard from './OrderCard'
import OrderDetailsModal from './OrderDetailsModal'

const greenGradient = { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }

// The slide-out Order History. It also owns the details modal, the cancel modal and the
// success/error popup, because they are all opened from here.
export default function OrderHistoryPanel({ open, onClose }) {
  const [orders, setOrders] = useState(null) // null = not loaded yet
  const [reloadKey, setReloadKey] = useState(0) // changes to reload the list
  const [detailsId, setDetailsId] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [message, setMessage] = useState(null) // { type, text }

  useBodyScrollLock(open)
  // Escape closes the panel, unless a pop-up is open on top of it (that one closes first)
  useEscapeKey(open && !detailsId && !cancelId && !message, onClose)

  // Load the orders each time the panel opens (and after an order is cancelled)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    getUserOrders()
      .then((list) => {
        if (!cancelled) setOrders(list)
      })
      .catch((error) => {
        console.error('Error loading order history:', error)
        if (!cancelled) setOrders([])
      })
    return () => {
      cancelled = true
    }
  }, [open, reloadKey])

  return (
    <>
      <div
        id="orderHistoryPanel"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 transform ${open ? 'shadow-2xl visible' : 'translate-x-full invisible'} transition-[transform,visibility] duration-300 ease-out`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative px-5 py-4 sm:p-6 bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 translate-x-12"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="playfair text-xl sm:text-2xl font-semibold mb-0.5 sm:mb-1">Order History</h2>
                <p className="inter text-sm text-white/80">Your past orders</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-colors duration-300">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Order Items */}
          <div id="orderHistoryItems" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {orders && orders.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                  <i className="bx bx-history text-3xl text-green-500"></i>
                </div>
                <h3 className="playfair text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
                <p className="inter text-sm text-gray-500 mb-6">Start shopping to see your order history</p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 inter"
                  style={greenGradient}
                >
                  Start Shopping
                </button>
              </div>
            )}
            {orders &&
              orders.map((order) => (
                <OrderCard key={order.order_id} order={order} onViewDetails={setDetailsId} onCancel={setCancelId} />
              ))}
          </div>

          {/* Footer */}
          <div className="relative px-4 py-3 sm:p-6 bg-white border-t border-gray-200">
            {/* Decorative line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
            <div className="space-y-4">
              {/* Summary */}
              <div className="space-y-2 sm:py-2">
                <div className="flex justify-between items-center">
                  <span className="inter text-sm text-gray-600">Total Orders:</span>
                  <span id="orderHistoryTotal" className="inter text-sm font-medium text-gray-900">{orders ? orders.length : 0}</span>
                </div>
              </div>

              {/* Close button and trust row: wider screens only. On phones the panel is full screen and
                  the X at the top closes it, so these only took space from the orders. */}
              <div className="hidden sm:block space-y-3 pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 border-2 border-green-200 text-green-700 font-medium rounded-2xl hover:border-green-300 hover:bg-green-50 transition-all duration-300 inter group"
                >
                  <span className="group-hover:text-green-900">Close</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center justify-center pt-4 space-x-6 text-xs inter text-green-600">
                <div className="flex items-center space-x-1">
                  <i className="bx bx-check-shield text-green-500"></i>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="bx bx-history text-green-500"></i>
                  <span>Track Orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History Overlay */}
      <div id="orderHistoryOverlay" className={`fixed inset-0 bg-black/50 z-40 ${open ? '' : 'hidden'}`} onClick={onClose}></div>

      {detailsId && (
        <OrderDetailsModal
          orderId={detailsId}
          onClose={() => setDetailsId(null)}
          onCancel={setCancelId}
        />
      )}

      {cancelId && (
        <CancelOrderModal
          orderId={cancelId}
          onClose={() => setCancelId(null)}
          onResult={setMessage}
          onCancelled={() => setReloadKey((n) => n + 1)}
        />
      )}

      {message && <MessageModal type={message.type} message={message.text} onClose={() => setMessage(null)} />}
    </>
  )
}
