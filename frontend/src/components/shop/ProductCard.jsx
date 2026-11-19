import { useState } from 'react'
import { formatPrice } from '../../utils/formatPrice'

// One product in the grid. `animation` is the CSS class that slides/fades the card in or out.
// The card fills its grid column (it used to be fixed at 256px, which left uneven gaps).
export default function ProductCard({ product, animation, delay = 0, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <div
      className={`product-card ${animation} card-hover bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden luxury-shadow border border-white/30 cursor-pointer w-full`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      onClick={() => onOpen(product)}
    >
      {/* Image Section */}
      <div className="relative bg-gradient-to-br from-blue-50/80 via-white/90 to-indigo-50/80 p-2 sm:p-4">
        {imageFailed ? (
          // Missing picture: a gem in the same square instead of a broken image and its alt text
          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <i className="bx bx-diamond text-4xl text-blue-300"></i>
          </div>
        ) : (
          <img
            src={`/uploads/products/${product.image}`}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full aspect-square object-cover rounded-xl image-glow"
          />
        )}
      </div>

      {/* Content Section - Clean and Minimal */}
      <div className="p-3 sm:p-5">
        <div className="mb-1 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-medium text-gray-500 inter uppercase tracking-wider">
            {product.type.toUpperCase()}
          </span>
        </div>
        <h3 className="playfair text-[15px] sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-3 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-1">
          <span className="cormorant text-lg sm:text-2xl font-bold gradient-text">₱{formatPrice(product.price)}</span>
          {/* "PHP" repeats the peso sign, so phones skip it to keep the price on one line */}
          <span className="hidden sm:inline inter text-sm text-gray-400 font-light">PHP</span>
        </div>
      </div>
    </div>
  )
}
