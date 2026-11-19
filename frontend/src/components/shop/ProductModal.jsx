import { useEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useCart } from '../../hooks/useCart'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { formatPrice } from '../../utils/formatPrice'

const DEFAULT_DESCRIPTION =
  'An exquisite piece crafted with precision and elegance. This stunning jewelry features intricate details that capture and reflect light beautifully, creating a celestial sparkle that embodies luxury and sophistication.'

// Long descriptions are cut to the length of the default text, like the old modal did.
function modalDescription(description) {
  let text = description || DEFAULT_DESCRIPTION
  if (text.length > DEFAULT_DESCRIPTION.length) {
    text = text.substring(0, DEFAULT_DESCRIPTION.length) + '...'
  }
  return text
}

const addButtonClass =
  'py-3 px-3 sm:px-4 whitespace-nowrap text-sm sm:text-base border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 inter'
const grey = { backgroundColor: '#9ca3af', color: 'white', borderColor: '#9ca3af' }

export default function ProductModal({ product, onClose, onAddedToCart, onBuyNow }) {
  const { addToCart, getQuantity } = useCart()
  const [status, setStatus] = useState('idle') // 'idle' | 'adding' | 'added'
  const [buying, setBuying] = useState(false) // Buy Now is preparing the order
  const [imageFailed, setImageFailed] = useState(false)
  const timer = useRef(null)

  // Close with Escape, stop the page behind from scrolling (without it shifting sideways)
  useEscapeKey(true, onClose)
  useBodyScrollLock()

  // Stop the "Added!" reset timer only when the modal really goes away.
  // (It must not live in the effect above: that one re-runs whenever onClose changes.)
  useEffect(() => () => clearTimeout(timer.current), [])

  const inCart = getQuantity(product.id)
  const outOfStock = product.stock <= 0
  const maxReached = !outOfStock && inCart >= product.stock
  const stockBadge = outOfStock
    ? { text: 'Out of Stock', color: 'from-rose-500 to-red-500' }
    : product.stock <= 3
      ? { text: `Only ${product.stock} left`, color: 'from-amber-400 to-orange-500' }
      : { text: `In Stock - ${product.stock} Available`, color: 'from-emerald-400 to-green-500' }

  const handleAdd = async () => {
    setStatus('adding')
    try {
      const data = await addToCart(product.id, 1)
      if (data.success) {
        setStatus('added')
        timer.current = setTimeout(() => setStatus('idle'), 2000)
        onAddedToCart?.()
      } else {
        alert('Error: ' + data.error)
        setStatus('idle')
      }
    } catch {
      alert('Error adding to cart')
      setStatus('idle')
    }
  }

  // What the "Add to Cart" button looks like right now
  let addButton
  if (status === 'adding') {
    addButton = {
      disabled: true,
      style: { backgroundColor: '#6b7280', color: 'white', borderColor: '#6b7280' },
      content: (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Adding...
        </div>
      ),
    }
  } else if (status === 'added') {
    addButton = {
      disabled: true,
      style: { backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' },
      content: (
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Added!
        </div>
      ),
    }
  } else if (outOfStock) {
    addButton = { disabled: true, style: grey, extra: ' opacity-50 cursor-not-allowed', content: 'Add to Cart' }
  } else if (maxReached) {
    addButton = {
      disabled: true,
      style: grey,
      extra: ' opacity-50 cursor-not-allowed',
      content: `Max Stock Reached (${inCart}/${product.stock})`,
    }
  } else {
    addButton = { disabled: false, content: `Add to Cart (${inCart}/${product.stock})` }
  }

  return (
    <div id="productModal" className="fixed inset-0 z-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-20 left-20 w-4 h-4 gold-gradient rounded-full opacity-20"></div>
        <div className="floating-element absolute top-40 right-32 w-6 h-6 bg-white rounded-full opacity-30" style={{ animationDelay: '-2s' }}></div>
        <div className="floating-element absolute bottom-32 left-1/4 w-3 h-3 bg-blue-300 rounded-full opacity-25" style={{ animationDelay: '-4s' }}></div>
        <div className="floating-element absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full opacity-20" style={{ animationDelay: '-1s' }}></div>
      </div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md modal-backdrop z-40" onClick={onClose}></div>

      {/* Modal. This layer scrolls when the card is taller than the screen, and a click on the
          dark area around the card closes it. */}
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative z-50 w-full max-w-5xl mx-auto modal-entrance" onClick={(e) => e.stopPropagation()}>
            {/* Desktop: a fixed height that always fits the screen; the details side scrolls if it needs to.
                Phones and tablets: picture on top, details below, the whole layer scrolls. */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl luxury-shadow overflow-clip border border-white/20 lg:h-[min(780px,calc(100dvh-2rem))]">
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 lg:top-5 lg:right-5 z-10 w-10 h-10 lg:w-11 lg:h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 group luxury-shadow"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>

              <div className="flex flex-col lg:flex-row gap-0 lg:h-full">
                {/* Image Section */}
                <div className="lg:w-1/2 lg:h-full relative bg-gradient-to-br from-blue-50/50 via-white/80 to-indigo-50/50 p-4 sm:p-6 flex flex-col items-center justify-center">
                  <div className="relative group w-full lg:h-full">
                    <div className="absolute inset-0 gold-gradient rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 luxury-shadow border border-white/40 lg:h-full">
                      {imageFailed ? (
                        // The picture is missing: show a gem in the same space instead of a broken image
                        <div className="w-full aspect-square max-h-[55vh] sm:max-h-[420px] lg:max-h-none lg:aspect-auto lg:h-full rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <i className="bx bx-diamond text-6xl text-blue-300"></i>
                        </div>
                      ) : (
                        <img
                          id="modalProductImage"
                          alt={product.name}
                          onError={() => setImageFailed(true)}
                          src={`/uploads/products/${product.image}`}
                          className="w-full aspect-square max-h-[55vh] sm:max-h-[420px] lg:max-h-none lg:aspect-auto lg:h-full object-cover rounded-xl image-glow"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:w-1/2 lg:h-full lg:overflow-y-auto lg:flex lg:flex-col p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-white/95 to-gray-50/80 backdrop-blur-sm">
                  {/* Centered top to bottom on desktop when it fits; scrolls from the top when it does not */}
                  <div className="lg:my-auto">
                  {/* Category, and the material when the product has one */}
                  <div className="mb-4 flex flex-wrap gap-2 pr-12">
                    <span id="modalProductType" className="inline-block px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/50 inter uppercase tracking-wider">
                      {product.type}
                    </span>
                    {product.material && (
                      <span id="modalProductMaterial" className="inline-block px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200/60 inter uppercase tracking-wider">
                        {product.material}
                      </span>
                    )}
                  </div>

                  <h1 id="modalProductName" className="playfair text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 leading-tight pr-10">
                    {product.name}
                  </h1>

                  <p id="modalProductDescription" className="inter text-gray-600 text-[15px] sm:text-base mb-5 sm:mb-6 leading-relaxed">
                    {modalDescription(product.description)}
                  </p>

                  {/* Price Section */}
                  <div className="mb-5 sm:mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span id="modalProductPrice" className="cormorant text-3xl sm:text-4xl font-bold gold-gradient bg-clip-text text-transparent">
                        ₱{formatPrice(product.price)}
                      </span>
                      <span className="inter text-lg text-gray-400 font-light">PHP</span>
                    </div>
                    {/* Stock: green when there is plenty, amber when only a few are left, red when sold out */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-white shadow-lg mb-2 bg-gradient-to-r ${stockBadge.color}`}>
                      <div className="w-2 h-2 bg-white rounded-full mr-2 opacity-90"></div>
                      <span className="text-sm font-medium inter" id="modalStockBadge">
                        {stockBadge.text}
                      </span>
                    </div>
                    <p className="inter text-sm text-gray-500">Pickup only - Visit our store</p>
                  </div>

                  {/* Features (general text, the same for every product): hidden on phones to keep the buttons close */}
                  <div className="hidden sm:block mb-6">
                    <h3 className="playfair text-lg font-semibold text-gray-900 mb-3">Features</h3>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 gold-gradient rounded-full diamond-sparkle"></div>
                        <span className="inter text-gray-700">Premium Materials</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 gold-gradient rounded-full diamond-sparkle" style={{ animationDelay: '-0.3s' }}></div>
                        <span className="inter text-gray-700">Handcrafted Design</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 gold-gradient rounded-full diamond-sparkle" style={{ animationDelay: '-0.6s' }}></div>
                        <span className="inter text-gray-700">Quality Guaranteed</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: on phones they stay pinned to the bottom of the screen while the details scroll */}
                  <div className="space-y-3 max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-6 max-sm:px-6 max-sm:py-3 max-sm:bg-white/95 max-sm:backdrop-blur max-sm:border-t max-sm:border-gray-100">
                    <button
                      id="buyNowBtn"
                      onClick={() => onBuyNow?.(product, () => setBuying(true))}
                      disabled={buying || outOfStock}
                      style={buying || outOfStock ? { backgroundColor: '#9ca3af', backgroundImage: 'none', color: 'white' } : undefined}
                      className={`w-full py-3.5 px-6 gold-gradient text-white font-semibold rounded-2xl transition-all duration-300 inter text-lg ${
                        outOfStock ? 'cursor-not-allowed' : 'hover:shadow-2xl hover:-translate-y-1'
                      }`}
                    >
                      {buying ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : outOfStock ? (
                        'Out of Stock'
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        id="addToCartBtn"
                        onClick={handleAdd}
                        disabled={addButton.disabled}
                        style={addButton.style}
                        className={addButtonClass + (addButton.extra || '')}
                      >
                        {addButton.content}
                      </button>
                      <button className={addButtonClass}>Share</button>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-5 pt-5 sm:mt-6 sm:pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm inter text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Authentic</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                        </svg>
                        <span>Certified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path>
                        </svg>
                        <span>Insured</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
