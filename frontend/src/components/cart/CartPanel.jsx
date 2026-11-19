import { useEffect } from 'react'
import { useCart } from '../../hooks/useCart'
import CartItem from './CartItem'

const checkoutGradient = { background: 'linear-gradient(135deg, #2474b6 0%, #1e5a8a 100%)' }

// The slide-out shopping cart. It stays in the page and slides in/out, like the original.
export default function CartPanel({ open, onClose, onCheckout }) {
  const { items, total, totalQuantity, loadCart } = useCart()

  // Refresh the cart each time the panel opens, and stop the page behind from scrolling
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    loadCart()
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [open, loadCart])

  const isEmpty = items.length === 0

  return (
    <>
      <div
        id="cartPanel"
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white shadow-2xl transform ${open ? '' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="relative p-6 text-white overflow-hidden" style={checkoutGradient}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="playfair text-2xl font-semibold mb-1">Shopping Cart</h2>
                <p className="inter text-sm text-white/80">Your selected items</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div id="cartItems" className="flex-1 overflow-y-auto p-6 space-y-4">
            {isEmpty ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <i className="bx bx-cart text-3xl text-blue-500"></i>
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
          <div className="relative p-6 bg-white border-t border-gray-200">
            {/* Decorative line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            <div className="space-y-4">
              {/* Cart Summary */}
              <div className="space-y-2 py-2">
                <div className="flex justify-between items-center">
                  <span className="inter text-sm text-gray-600">Items:</span>
                  <span id="cartStockTotal" className="inter text-sm font-medium text-gray-900">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="playfair text-xl font-semibold text-gray-900">Total</span>
                  <span id="cartTotal" className="cormorant text-3xl font-bold gradient-text">
                    ₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  id="checkoutBtn"
                  onClick={onCheckout}
                  disabled={isEmpty}
                  className={`w-full py-4 px-6 text-white font-semibold rounded-2xl transition-all duration-300 inter text-lg relative overflow-hidden group ${isEmpty ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl hover:-translate-y-1'}`}
                  style={checkoutGradient}
                >
                  <span className="relative z-10">Proceed to Checkout</span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, #1e5a8a 0%, #154a73 100%)' }}
                  ></div>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 border-2 border-blue-200 text-blue-700 font-medium rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 inter group"
                >
                  <span className="group-hover:text-blue-900">Continue Shopping</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center pt-4 space-x-6 text-xs inter text-blue-600">
                <div className="flex items-center space-x-1">
                  <i className="bx bx-shield-check text-blue-500"></i>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="bx bx-truck text-blue-500"></i>
                  <span>Free Shipping</span>
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
