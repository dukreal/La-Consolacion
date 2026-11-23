import { useEffect } from 'react'
import { useCart } from '../../hooks/useCart'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import CartItem from './CartItem'

// Site navy (same as checkout, login and the admin); the darker navy on hover
const checkoutGradient = { background: '#22306a' }

// The slide-out shopping cart. It stays in the page and slides in/out, like the original.
export default function CartPanel({ open, onClose, onCheckout }) {
  const { items, total, totalQuantity, loadCart } = useCart()

  // Refresh the cart each time the panel opens, and stop the page behind from scrolling
  useEffect(() => {
    if (open) loadCart()
  }, [open, loadCart])
  useBodyScrollLock(open)

  useEscapeKey(open, onClose)

  const isEmpty = items.length === 0

  return (
    <>
      <div
        id="cartPanel"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white transform ${open ? 'shadow-2xl visible' : 'translate-x-full invisible'} transition-[transform,visibility] duration-300 ease-in-out z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="relative px-5 py-4 sm:p-6 text-white overflow-hidden" style={checkoutGradient}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="playfair text-xl sm:text-2xl font-semibold mb-0.5 sm:mb-1">Shopping Cart</h2>
                <p className="inter text-sm text-white/80">Your selected items</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-colors duration-300">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div id="cartItems" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {isEmpty ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#eef1f8] rounded-full flex items-center justify-center">
                  <i className="bx bx-cart text-3xl text-[#22306a]"></i>
                </div>
                <h3 className="playfair text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p className="inter text-sm text-gray-500 mb-6">Add some beautiful jewelry to get started</p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 inter"
                  style={checkoutGradient}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => <CartItem key={item.cart_id} item={item} />)
            )}
          </div>

          {/* Cart Footer */}
          <div className="relative p-4 sm:p-6 bg-white border-t border-gray-200">
            {/* Decorative line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#d8dce8] to-transparent"></div>
            <div className="space-y-3 sm:space-y-4">
              {/* Cart Summary */}
              <div className="space-y-1 sm:space-y-2 sm:py-2">
                <div className="flex justify-between items-center">
                  <span className="inter text-sm text-gray-600">Items:</span>
                  <span id="cartStockTotal" className="inter text-sm font-medium text-gray-900">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="playfair text-lg sm:text-xl font-semibold text-gray-900">Total</span>
                  <span id="cartTotal" className="cormorant text-2xl sm:text-3xl font-bold gradient-text">
                    ₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 sm:space-y-3 sm:pt-4">
                <button
                  id="checkoutBtn"
                  onClick={onCheckout}
                  disabled={isEmpty}
                  className={`w-full py-3.5 sm:py-4 px-6 text-white font-semibold rounded-2xl transition-shadow duration-300 inter text-base sm:text-lg relative overflow-hidden group ${isEmpty ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'}`}
                  style={checkoutGradient}
                >
                  <span className="relative z-10">Proceed to Checkout</span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: '#1a2550' }}
                  ></div>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 border-2 border-[#d8dce8] text-[#22306a] font-medium rounded-2xl [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] transition-colors duration-300 inter"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Trust Indicators (wider screens only; on phones the buttons matter more) */}
              <div className="hidden sm:flex items-center justify-center pt-4 space-x-6 text-xs inter text-gray-500">
                <div className="flex items-center space-x-1">
                  <i className="bx bx-check-shield text-[#2474b6]"></i>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  {/* Store pickup, or shipped by LBC / another courier at the customer's cost (so not "Free Shipping") */}
                  <i className="bx bx-package text-[#2474b6]"></i>
                  <span>Pickup or Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Overlay */}
      <div id="cartOverlay" className={`fixed inset-0 bg-black/50 z-40 ${open ? '' : 'hidden'}`} onClick={onClose}></div>
    </>
  )
}
