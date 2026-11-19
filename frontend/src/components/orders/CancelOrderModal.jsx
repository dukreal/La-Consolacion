import { useState } from 'react'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { cancelOrder } from '../../services/orderService'

// "Are you sure you want to cancel this order?" confirmation.
// onResult({ type, text }) shows the success/error popup; onCancelled() reloads the order list.
export default function CancelOrderModal({ orderId, onClose, onResult, onCancelled }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useBodyScrollLock()
  const [cancelling, setCancelling] = useState(false)

  const handleConfirm = async () => {
    setCancelling(true)
    try {
      const data = await cancelOrder(orderId)
      if (data.success) {
        onResult({ type: 'success', text: data.message })
        requestClose()
        onCancelled()
      } else {
        onResult({ type: 'error', text: 'Error cancelling order: ' + data.error })
      }
    } catch {
      onResult({ type: 'error', text: 'Error cancelling order' })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div id="cancelOrderModal" className="fixed inset-0 z-[9999]">
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={requestClose}></div>

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 pointer-events-auto ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="bx bx-x-circle text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                <p className="text-sm text-gray-600">Are you sure you want to cancel this order?</p>
              </div>
            </div>
            <button onClick={requestClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="bx bx-x text-xl text-gray-500"></i>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <i className="bx bx-info-circle text-red-600 mt-0.5"></i>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">
                      Order #<span id="cancelOrderId">{orderId}</span>
                    </h4>
                    <p className="text-sm text-red-700 leading-relaxed">This action will:</p>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      <li className="flex items-center space-x-2">
                        <i className="bx bx-check text-red-600"></i>
                        <span>Cancel your order immediately</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <i className="bx bx-check text-red-600"></i>
                        <span>Restore product stock</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <i className="bx bx-x text-red-600"></i>
                        <span>Cannot be undone</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              <p>
                This action is permanent and cannot be reversed. Please make sure you want to cancel this order
                before proceeding.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={requestClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              Keep Order
            </button>
            <button
              onClick={handleConfirm}
              disabled={cancelling}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-300"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
