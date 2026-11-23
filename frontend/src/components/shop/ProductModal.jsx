import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useCart } from '../../hooks/useCart'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { cartErrorMessage } from '../../utils/cartMessages'
import { formatPrice } from '../../utils/formatPrice'
import SiteDialog from '../common/SiteDialog'

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

// Site palette (same as the payment pages): navy #22306a, blue #2474b6, muted text #5b6478
const iconButton =
  'w-11 h-11 lg:w-10 lg:h-10 flex-shrink-0 rounded-full border border-[#e4e7ef] bg-white flex items-center justify-center text-[#22306a] hover:border-[#22306a] transition-colors'
const addButtonClass =
  'flex-1 h-[50px] lg:h-[52px] px-3 whitespace-nowrap rounded-xl border-[1.5px] border-[#c9cfdf] bg-white text-[#22306a] text-sm sm:text-[15px] font-semibold inter hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors'
const grey = { backgroundColor: '#9ca3af', color: 'white', borderColor: '#9ca3af' }

// The product picture, or a gem when the picture is missing
function ProductImage({ product, failed, onError, className }) {
  if (failed) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`}>
        <i className="bx bx-diamond text-6xl text-blue-300" aria-hidden="true"></i>
      </div>
    )
  }
  return <img alt={product.name} onError={onError} src={`/uploads/products/${product.image}`} className={`${className} object-cover`} />
}

// "Option B – Detail Sheet": picture on the left, the facts in a short table on the right,
// Add to Cart and Buy Now in a bar pinned to the bottom. Phones: a sheet that slides up from the bottom.
export default function ProductModal({ product, onClose, onAddedToCart, onBuyNow }) {
  const { addToCart, getQuantity } = useCart()
  const [status, setStatus] = useState('idle') // 'idle' | 'adding' | 'added'
  const [buying, setBuying] = useState(false) // Buy Now is preparing the order
  const [imageFailed, setImageFailed] = useState(false)
  const [addError, setAddError] = useState('') // why Add to Cart failed, shown in a pop-up
  const timer = useRef(null)

  // Close with Escape, stop the page behind from scrolling (without it shifting sideways)
  useEscapeKey(true, onClose)
  useBodyScrollLock()

  // Stop the "Added!" reset timer only when the modal really goes away.
  // (It must not live in the effect above: that one re-runs whenever onClose changes.)
  useEffect(() => () => clearTimeout(timer.current), [])

  // Desktop: the details must fit above the button bar without scrolling, whatever the screen height,
  // browser zoom or text size. If they don't fit, the description is shortened step by step:
  //   1. 3 lines   2. 2 lines   3. hidden. The buttons are pinned, so they are always visible.
  // (data-* attributes on the details area; the matching group-data-[...] classes are below)
  const detailsRef = useRef(null)
  useLayoutEffect(() => {
    const el = detailsRef.current
    if (!el) return
    const desktop = window.matchMedia('(min-width: 1024px)')
    const steps = [{}, { clamp: '3' }, { clamp: '2' }, { nodesc: '' }]
    const apply = (step) => {
      for (const key of ['clamp', 'nodesc']) {
        if (key in step) el.setAttribute(`data-${key}`, step[key])
        else el.removeAttribute(`data-${key}`)
      }
    }
    const fit = () => {
      if (!desktop.matches) return apply({})
      for (const step of steps) {
        apply(step)
        if (el.scrollHeight <= el.clientHeight + 1) return
      }
    }
    fit()
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit) // the fonts can arrive after the first check and change the height
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Phones: drag the sheet down by its handle (or the row with the Close button) to close it. It follows the finger; let go more than
  // 120px down (or with a quick flick) and it slides away, otherwise it springs back.
  const sheetRef = useRef(null)
  const drag = useRef(null)
  const onHandleDown = (e) => {
    if (!window.matchMedia('(max-width: 639px)').matches) return // phones only (the sheet)
    if (e.target.closest('button')) return // a tap on Close stays a tap
    drag.current = { startY: e.clientY, startTime: e.timeStamp, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    sheetRef.current.style.transition = 'none'
  }
  const onHandleMove = (e) => {
    if (!drag.current) return
    const dy = Math.max(0, e.clientY - drag.current.startY) // only downwards
    drag.current.dy = dy
    sheetRef.current.style.transform = `translateY(${dy}px)`
  }
  const onHandleUp = (e) => {
    if (!drag.current) return
    const { dy, startTime } = drag.current
    drag.current = null
    const sheet = sheetRef.current
    const flick = dy > 40 && dy / Math.max(1, e.timeStamp - startTime) > 0.6 // px per ms
    sheet.style.transition = 'transform 0.22s ease-out'
    if (dy > 120 || flick) {
      sheet.style.transform = 'translateY(100%)'
      setTimeout(onClose, 200)
    } else {
      sheet.style.transform = 'translateY(0)'
    }
  }

  const inCart = getQuantity(product.id)
  const outOfStock = product.stock <= 0
  const maxReached = !outOfStock && inCart >= product.stock
  // Availability: green when there is plenty, amber when only a few are left, red when sold out
  const availability = outOfStock
    ? { text: 'Out of stock', color: 'text-red-600' }
    : product.stock <= 3
      ? { text: `Only ${product.stock} left`, color: 'text-amber-700' }
      : { text: `In stock · ${product.stock} available`, color: 'text-green-700' }

  const handleAdd = async () => {
    setStatus('adding')
    try {
      const data = await addToCart(product.id, 1)
      if (data.success) {
        setStatus('added')
        timer.current = setTimeout(() => setStatus('idle'), 2000)
        onAddedToCart?.()
      } else {
        setAddError(cartErrorMessage(data.error))
        setStatus('idle')
      }
    } catch {
      setAddError(cartErrorMessage())
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
        <span className="flex items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Adding...
        </span>
      ),
    }
  } else if (status === 'added') {
    addButton = {
      disabled: true,
      style: { backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' },
      content: (
        <span className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Added!
        </span>
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

  // The facts table. Material only when the product has one.
  const facts = [
    { label: 'Type', value: product.type, className: 'capitalize text-[#22306a]', hideOnPhone: true },
    product.material && { label: 'Material', value: product.material, className: 'text-[#22306a]' },
    { label: 'Availability', value: availability.text, className: availability.color, id: 'modalStockBadge' },
    // Delivery is arranged with the shop after ordering; the customer pays the courier
    { label: 'Delivery', value: 'Store pickup, or LBC / courier at your cost', className: 'text-[#22306a]' },
  ].filter(Boolean)

  return (
    <div id="productModal" className="fixed inset-0 z-50">
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-[#161c34]/50 backdrop-blur-[2px] modal-backdrop z-40" onClick={onClose}></div>

      {/* Phones: the sheet sits at the bottom of the screen. Tablets and desktop: centered.
          A click on the dark area around the card closes it. */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalProductName"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-xl lg:max-w-5xl modal-entrance bg-white overflow-hidden flex flex-col lg:flex-row rounded-t-3xl sm:rounded-3xl shadow-[0_24px_64px_rgba(10,16,40,0.35)] max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2rem)] lg:h-[min(40rem,calc(100dvh-3rem))]"
        >
          {/* Desktop picture (left) */}
          <div className="hidden lg:block lg:w-[48%] flex-shrink-0 bg-[#f5f6fa] p-5">
            <ProductImage product={product} failed={imageFailed} onError={() => setImageFailed(true)} className="w-full h-full rounded-2xl" />
          </div>

          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            {/* Phones: the grab handle of the sheet. Drag it down to close (the Close button does the same). */}
            <div
              className="sm:hidden flex justify-center pt-2.5 pb-2 touch-none cursor-grab active:cursor-grabbing"
              aria-hidden="true"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
            >
              <span className="w-10 h-1 rounded-full bg-[#d8dce8]"></span>
            </div>

            {/* Details: scroll on phones and tablets; on desktop they fit (see the fit steps above) */}
            <div ref={detailsRef} className="group flex-1 min-h-0 overflow-y-auto px-4 sm:px-7 lg:px-9 pt-2 sm:pt-6 lg:pt-8 pb-5">
              {/* Phones: this row can be dragged too, so the sheet is easy to grab */}
              <div
                className="flex items-center gap-2 max-sm:touch-none"
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
              >
                <span id="modalProductType" className="px-3 py-1 rounded-full bg-[#eef1f8] text-[#22306a] text-[11px] lg:text-xs font-semibold tracking-[0.08em] uppercase inter">
                  {product.type}
                </span>
                <div className="flex-1"></div>
                <button type="button" onClick={onClose} aria-label="Close" className={iconButton}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18"></path>
                  </svg>
                </button>
              </div>

              {/* Phones and tablets: the picture under the buttons */}
              <ProductImage
                product={product}
                failed={imageFailed}
                onError={() => setImageFailed(true)}
                className="lg:hidden mt-3 w-full h-60 sm:h-80 rounded-2xl"
              />

              <h2 id="modalProductName" className="playfair mt-4 text-[25px] sm:text-[28px] lg:text-[2rem] leading-tight font-bold text-[#22306a]">
                {product.name}
              </h2>
              <p id="modalProductPrice" className="cormorant mt-2 lg:mt-3 text-[30px] lg:text-[36px] leading-none font-bold text-[#22306a]">
                ₱{formatPrice(product.price)}
              </p>

              <dl className="mt-4 lg:mt-5 border-t border-[#eef0f5] text-[13px] sm:text-sm inter">
                {facts.map((fact) => (
                  <div key={fact.label} className={`justify-between gap-4 py-2.5 lg:py-[11px] border-b border-[#eef0f5] ${fact.hideOnPhone ? 'hidden sm:flex' : 'flex'}`}>
                    <dt className="text-[#5b6478]">{fact.label}</dt>
                    <dd id={fact.id} className={`font-semibold text-right ${fact.className}`}>{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <p
                id="modalProductDescription"
                className="mt-3 lg:mt-4 text-[13px] sm:text-sm leading-relaxed text-[#5b6478] inter group-data-[clamp=3]:line-clamp-3 group-data-[clamp=2]:line-clamp-2 group-data-[nodesc]:hidden"
              >
                {modalDescription(product.description)}
              </p>
            </div>

            {/* Button bar, pinned to the bottom */}
            <div className="flex-shrink-0 flex gap-2.5 lg:gap-3 px-4 sm:px-7 lg:px-9 pt-3 pb-5 sm:py-4 lg:py-[18px] border-t border-[#eef0f5] bg-[#fbfcfe] max-lg:shadow-[0_-6px_20px_rgba(10,16,40,0.06)]">
              <button
                id="addToCartBtn"
                type="button"
                onClick={handleAdd}
                disabled={addButton.disabled}
                style={addButton.style}
                className={addButtonClass + (addButton.extra || '')}
              >
                {addButton.content}
              </button>
              <button
                id="buyNowBtn"
                type="button"
                onClick={() => onBuyNow?.(product, () => setBuying(true))}
                disabled={buying || outOfStock}
                style={buying || outOfStock ? { backgroundColor: '#9ca3af', color: 'white' } : undefined}
                className={`flex-1 h-[50px] lg:h-[52px] px-3 whitespace-nowrap rounded-xl bg-[#22306a] text-white text-[15px] lg:text-base font-semibold inter transition-[background-color,box-shadow] ${
                  outOfStock ? 'cursor-not-allowed' : 'hover:bg-[#1a2550] hover:shadow-[0_6px_18px_rgba(34,48,106,0.25)]'
                }`}
              >
                {buying ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Processing...
                  </span>
                ) : outOfStock ? (
                  'Out of Stock'
                ) : (
                  'Buy Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {addError && <SiteDialog title="Couldn't add to cart" message={addError} onClose={() => setAddError('')} />}
    </div>
  )
}
