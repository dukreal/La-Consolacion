import { useState } from 'react'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { cancelOrder } from '../../services/orderService'

// "Are you sure you want to cancel this order?" confirmation.
// onResult({ type, text }) shows the success/error popup; onCancelled() reloads the order list.
export default function CancelOrderModal({ orderId, onClose, onResult, onCancelled }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useEscapeKey(true, requestClose)
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
        onResult({ type: 'error', text: data.error || 'Could not cancel the order. Please try again.' })
      }
    } catch {
      onResult({ type: 'error', text: 'Could not reach the server. Please try again.' })
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancelOrderTitle"
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto transform transition-all duration-300 pointer-events-auto ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          {/* Header */}
          <div className="relative p-5 sm:p-6 pr-14 sm:pr-14 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 bg-red-100 rounded-full flex items-center justify-center">
                <i className="bx bx-x-circle text-2xl text-red-600"></i>
              </div>
              <div className="min-w-0">
                <h3 id="cancelOrderTitle" className="text-lg sm:text-xl font-bold text-gray-900">
                  Cancel Order #<span id="cancelOrderId">{orderId}</span>?
                </h3>
                <p className="text-sm text-gray-600">Please confirm before you continue.</p>
              </div>
            </div>
            <button
              onClick={requestClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="bx bx-x text-xl text-gray-500"></i>
            </button>
          </div>

          {/* Content: what cancelling means for the customer */}
          <div className="p-5 sm:p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">If you cancel this order:</p>
              <ul className="text-sm text-red-700 space-y-2">
                <li className="flex items-start gap-2">
                  <i className="bx bx-x-circle text-base text-red-600 mt-0.5 flex-shrink-0"></i>
                  <span>It will be cancelled right away and the shop will stop preparing it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-error-circle text-base text-red-600 mt-0.5 flex-shrink-0"></i>
                  <span>This can't be undone. To get these items, you'll need to place a new order.</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-wallet text-base text-red-600 mt-0.5 flex-shrink-0"></i>
                  <span>If you already paid, please contact the shop about your payment.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer: stacked on very small phones (main action on top), side by side from 400px */}
          <div className="flex flex-col-reverse min-[400px]:flex-row gap-3 p-5 sm:p-6 border-t border-gray-200">
            <button
              onClick={requestClose}
              className="flex-1 py-3 px-4 whitespace-nowrap border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              Keep Order
            </button>
            <button
              onClick={handleConfirm}
              disabled={cancelling}
              className="flex-1 py-3 px-4 whitespace-nowrap bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
