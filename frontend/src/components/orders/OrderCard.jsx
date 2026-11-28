import { formatMoney } from '../../utils/formatMoney'
import { orderRef, orderTitle } from '../../utils/orderRef'
import { orderStatus } from '../../utils/orderStatus'
import { methodLabel } from '../../utils/storePayments'

// One order in My Account > Order history. Named by its product ("Crown Diamond Ring + 2 more"), with the
// reference the customer can quote to the shop (LCJ-0951, the same as in the emails).
export default function OrderCard({ order, onViewDetails, onCancel }) {
  const status = orderStatus(order.status)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 pr-3">
            <h4 className="playfair font-semibold text-gray-900 text-[15px] leading-snug mb-1 break-words">
              {orderTitle(order.first_item, order.item_lines)}
              {order.is_custom && (
                <span className="ml-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 align-middle inter text-[11px] font-medium text-blue-700">
                  Custom Order
                </span>
              )}
            </h4>
            <p className="inter text-xs text-gray-500">
              {order.order_date} · Ref. {orderRef(order.order_id)}
            </p>
            {/* Store pickup or delivery by courier (orders from before delivery existed are pickup) */}
            <p className="inter text-xs text-gray-600 mt-0.5 flex items-center gap-1">
              <i className={`bx ${order.fulfillment === 'delivery' ? 'bx-package' : 'bx-store'} text-[#2474b6]`} aria-hidden="true"></i>
              {order.fulfillment === 'delivery' ? 'Delivery by courier' : 'Store pickup'}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="cormorant font-bold gradient-text text-2xl mb-1">₱{order.total_amount}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.badge}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* All the products with their quantities (the title already names a single product) */}
        {(order.item_lines > 1 || !order.first_item) && (
          <div className="mb-3">
            <p className="inter text-sm text-gray-600 leading-relaxed">{order.order_items}</p>
          </div>
        )}

        {/* Payment Info */}
        {order.reference_number && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
              <span>Paid with {methodLabel(String(order.service || '').toUpperCase())}</span>
              {/* The payment's own reference number, not the order's reference above */}
              <span className="min-w-0 truncate">Transaction no. {order.reference_number}</span>
            </div>
            {/* Paid with a 30% downpayment: what was paid, and the balance to pay at pickup (or that it is paid) */}
            {(order.balance > 0 || order.balance_paid) && (
              <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-gray-600">
                <span>
                  Downpayment paid: <span className="font-semibold text-gray-800">₱{formatMoney(order.payment_amount)}</span>
                </span>
                {order.balance_paid ? (
                  <span className="font-semibold text-emerald-700">Fully paid</span>
                ) : (
                  <span>
                    Balance to pay: <span className="font-semibold text-orange-700">₱{formatMoney(order.balance)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 -ml-3">
            <button
              onClick={() => onViewDetails(order.order_id)}
              className="px-3 py-2 text-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              View Details
            </button>
            {order.can_cancel && (
              <button
                onClick={() => onCancel(order.order_id)}
                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
