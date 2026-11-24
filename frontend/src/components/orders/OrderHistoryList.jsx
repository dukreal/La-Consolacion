import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import MessageModal from '../common/MessageModal'
import { getUserOrders } from '../../services/orderService'
import CancelOrderModal from './CancelOrderModal'
import OrderCard from './OrderCard'
import OrderDetailsModal from './OrderDetailsModal'

// The customer's orders, for the "Order history" section of My Account (pages/customer/Profile.jsx).
// It also owns the details pop-up, the cancel pop-up and the success/error message, because they open from here.
// The pop-ups are put straight into <body> (a portal): inside the My Account card they would be trapped in the card,
// because its frosted-glass background (backdrop-filter) makes position: fixed relative to the card.
export default function OrderHistoryList() {
  const [orders, setOrders] = useState(null) // null = not loaded yet
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0) // changes to reload the list
  const [detailsId, setDetailsId] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [message, setMessage] = useState(null) // { type, text }

  // Load the orders when the section opens (and again after an order is cancelled)
  useEffect(() => {
    let cancelled = false
    getUserOrders()
      .then((list) => {
        if (!cancelled) {
          setOrders(list)
          setFailed(false)
        }
      })
      .catch((error) => {
        console.error('Error loading order history:', error)
        if (!cancelled) {
          setOrders([])
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // "shop-page" turns on the shop's fonts and price styles (styles/shop.css), which the order cards use
  return (
    <div className="shop-page">
      <div id="orderHistoryItems" aria-busy={orders === null}>
        {orders === null && (
          <div className="space-y-3" aria-hidden="true">
            {[1, 2].map((n) => (
              <div key={n} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {failed && (
          <p role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            Could not load your orders. Please try again later.
          </p>
        )}

        {orders && orders.length === 0 && !failed && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#eef1f8] rounded-full flex items-center justify-center">
              <i className="bx bx-history text-3xl text-[#22306a]" aria-hidden="true"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-5">Start shopping to see your order history</p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center min-h-11 px-6 rounded-xl bg-[#22306a] text-white font-semibold transition-colors [@media(hover:hover)]:hover:bg-[#1a2550]"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div id="orderHistoryList" className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.order_id} order={order} onViewDetails={setDetailsId} onCancel={setCancelId} />
            ))}
          </div>
        )}
      </div>

      {(detailsId || cancelId || message) &&
        createPortal(
          <div className="shop-page">
            {detailsId && <OrderDetailsModal orderId={detailsId} onClose={() => setDetailsId(null)} onCancel={setCancelId} />}

            {cancelId && (
              <CancelOrderModal
                orderId={cancelId}
                onClose={() => setCancelId(null)}
                onResult={setMessage}
                onCancelled={() => setReloadKey((n) => n + 1)}
              />
            )}

            {message && <MessageModal type={message.type} message={message.text} onClose={() => setMessage(null)} />}
          </div>,
          document.body,
        )}
    </div>
  )
}
