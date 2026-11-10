// One order in the Order History panel.
export default function OrderCard({ order, onViewDetails, onCancel }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="playfair font-semibold text-gray-900 text-sm leading-tight mb-1">Order #{order.order_id}</h4>
            <p className="inter text-xs text-gray-500">{order.order_date}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="cormorant font-bold gradient-text text-2xl mb-1">₱{order.total_amount}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${order.status_class}`}>
              {order.status_text}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-3">
          <p className="inter text-sm text-gray-600 leading-relaxed">{order.order_items}</p>
        </div>

        {/* Payment Info */}
        {order.reference_number && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Payment: {order.service}</span>
              <span>Ref: {order.reference_number}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(order.order_id)}
              className="px-3 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              View Details
            </button>
            {order.can_cancel && (
              <button
                onClick={() => onCancel(order.order_id)}
                className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Cancel Order
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">ID: {order.order_id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
