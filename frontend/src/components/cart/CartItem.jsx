import { useCart } from '../../hooks/useCart'

const stepperClass =
  'w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all duration-200'

// One product row inside the cart panel.
export default function CartItem({ item }) {
  const { setQuantity, removeItem } = useCart()

  const atMinimum = item.quantity <= 1
  const atMaximum = item.quantity >= item.stock

  const changeQuantity = async (change) => {
    try {
      const data = await setQuantity(item.product_id, item.quantity + change)
      if (!data.success) alert('Error updating quantity: ' + data.error)
    } catch {
      alert('Error updating quantity')
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remove this item from cart?')) return
    try {
      const data = await removeItem(item.product_id)
      if (!data.success) alert('Error removing item: ' + data.error)
    } catch {
      alert('Error removing item')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Top Row: Image and Product Details */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <img
              src={`/uploads/products/${item.image}`}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg shadow-sm"
            />
          </div>
          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h4 className="playfair font-semibold text-gray-900 text-sm leading-tight mb-1">{item.name}</h4>
            <p className="inter text-xs text-gray-500 uppercase tracking-wider mb-2">{item.type}</p>
            <p className="cormorant font-bold gradient-text text-lg mb-2">₱{item.price.toLocaleString('en-US')}</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <i className="bx bx-package mr-1"></i>
                Stock: {item.stock}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Controls and Total */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => changeQuantity(-1)}
                disabled={atMinimum}
                className={`${stepperClass} ${atMinimum ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className="bx bx-minus text-sm"></i>
              </button>
              <span className="px-4 py-1 text-sm font-bold text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
              <button
                onClick={() => changeQuantity(1)}
                disabled={atMaximum}
                className={`${stepperClass} ${atMaximum ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className="bx bx-plus text-sm"></i>
              </button>
            </div>
            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <i className="bx bx-trash text-sm"></i>
            </button>
          </div>
          {/* Item Total */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1">
            <span className="inter text-sm font-medium text-gray-700">Total:</span>
            <span className="cormorant font-bold gradient-text text-lg">
              ₱{(item.price * item.quantity).toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
