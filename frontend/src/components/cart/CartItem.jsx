import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { cartErrorMessage } from '../../utils/cartMessages'
import SiteDialog from '../common/SiteDialog'
import { formatMoney } from '../../utils/formatMoney'

const stepperClass =
  'w-9 h-9 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all duration-200'

// One product row inside the cart panel.
export default function CartItem({ item }) {
  const { setQuantity, removeItem } = useCart()
  const [askRemove, setAskRemove] = useState(false)
  const [problem, setProblem] = useState(null) // { title, message } when something went wrong

  const atMinimum = item.quantity <= 1
  const atMaximum = item.quantity >= item.stock

  const changeQuantity = async (change) => {
    try {
      const data = await setQuantity(item.product_id, item.quantity + change)
      if (!data.success) setProblem({ title: "Couldn't update quantity", message: cartErrorMessage(data.error) })
    } catch {
      setProblem({ title: "Couldn't update quantity", message: cartErrorMessage() })
    }
  }

  // Runs after "Remove" is chosen in the "Remove this item?" pop-up
  const handleRemove = async () => {
    try {
      const data = await removeItem(item.product_id)
      if (!data.success) setProblem({ title: "Couldn't remove item", message: 'Something went wrong. Please try again.' })
    } catch {
      setProblem({ title: "Couldn't remove item", message: 'Something went wrong. Please try again.' })
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4">
        {/* Picture, name, price, and the remove button in the corner */}
        <div className="flex items-start gap-3">
          <img
            src={`/uploads/products/${item.image}`}
            alt={item.name}
            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 object-cover rounded-lg shadow-sm bg-gray-100"
          />
          <div className="flex-1 min-w-0">
            <h4 className="playfair font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2">{item.name}</h4>
            <p className="inter text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">
              {item.type} · {item.stock} in stock
            </p>
            <p className="cormorant font-bold gradient-text text-lg leading-tight mt-1">₱{formatMoney(item.price)}</p>
          </div>
          <button
            onClick={() => setAskRemove(true)}
            aria-label={`Remove ${item.name}`}
            className="w-9 h-9 -mr-1 -mt-1 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <i className="bx bx-trash text-lg"></i>
          </button>
        </div>

        {/* Quantity on the left, this item's total on the right */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
            <button
              onClick={() => changeQuantity(-1)}
              disabled={atMinimum}
              aria-label="Decrease quantity"
              className={`${stepperClass} ${atMinimum ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <i className="bx bx-minus text-base"></i>
            </button>
            <span className="min-w-[2.25rem] text-center text-sm font-bold text-gray-900">{item.quantity}</span>
            <button
              onClick={() => changeQuantity(1)}
              disabled={atMaximum}
              aria-label="Increase quantity"
              className={`${stepperClass} ${atMaximum ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <i className="bx bx-plus text-base"></i>
            </button>
          </div>
          <div className="text-right min-w-0">
            <span className="block inter text-[11px] text-gray-500">Subtotal</span>
            <span className="cormorant font-bold gradient-text text-xl leading-tight whitespace-nowrap">
              ₱{formatMoney(item.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>

      {askRemove && (
        <SiteDialog
          variant="danger"
          icon="bx-trash"
          title="Remove this item?"
          message={
            <>
              <strong className="font-semibold text-[#22306a]">{item.name}</strong> will be removed from your cart.
            </>
          }
          cancelLabel="Keep it"
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onClose={() => setAskRemove(false)}
        />
      )}
      {problem && <SiteDialog title={problem.title} message={problem.message} onClose={() => setProblem(null)} />}
    </div>
  )
}
