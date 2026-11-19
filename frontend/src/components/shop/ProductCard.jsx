import { formatPrice } from '../../utils/formatPrice'

// One product in the grid. `animation` is the CSS class that slides/fades the card in or out.
export default function ProductCard({ product, animation, delay = 0, onOpen }) {
  return (
    <div
      className={`product-card ${animation} card-hover bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden luxury-shadow border border-white/30 cursor-pointer w-64`}
      style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
      onClick={() => onOpen(product)}
    >
      {/* Image Section */}
      <div className="relative bg-gradient-to-br from-blue-50/80 via-white/90 to-indigo-50/80 p-4">
        <img
          src={`/uploads/products/${product.image}`}
          alt={product.name}
          className="w-full h-48 object-cover rounded-xl image-glow hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Content Section - Clean and Minimal */}
      <div className="p-5">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 inter uppercase tracking-wider">
            {product.type.toUpperCase()}
          </span>
        </div>
        <h3 className="playfair text-xl font-semibold text-gray-900 mb-3 leading-tight">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="cormorant text-2xl font-bold gradient-text">₱{formatPrice(product.price)}</span>
          <span className="inter text-sm text-gray-400 font-light">PHP</span>
        </div>
      </div>
    </div>
  )
}
