import { useCallback, useEffect, useRef, useState } from 'react'
import CartPanel from '../../components/cart/CartPanel'
import OrderHistoryPanel from '../../components/orders/OrderHistoryPanel'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import CategoryFilter from '../../components/shop/CategoryFilter'
import ProductCard from '../../components/shop/ProductCard'
import ProductModal from '../../components/shop/ProductModal'
import ProfileIncompleteModal from '../../components/shop/ProfileIncompleteModal'
import SortSelect from '../../components/shop/SortSelect'
import { useCheckout } from '../../hooks/useCheckout'
import { useOpenFromUrl } from '../../hooks/useOpenFromUrl'
import { getProducts } from '../../services/productService'

// Names used in the "No ... Found" message
const CATEGORY_NAMES = { ring: 'Rings', bracelet: 'Bracelets', earring: 'Earrings', charm: 'Charms' }

// 'featured' and 'newest' keep the order PHP sent (newest first).
function sortProducts(list, sort) {
  const sorted = [...list]
  if (sort === 'price-low') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-high') sorted.sort((a, b) => b.price - a.price)
  if (sort === 'name-asc') sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  if (sort === 'name-desc') sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()))
  return sorted
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [activeFilter, setActiveFilter] = useState('all') // the highlighted button
  const [shownFilter, setShownFilter] = useState('all') // the category whose cards are on screen
  const [sort, setSort] = useState('featured')
  const [leaving, setLeaving] = useState(false) // cards are sliding out
  const [run, setRun] = useState(0) // changes to replay the slide-in animation
  const [cardAnimation, setCardAnimation] = useState({ name: 'card-enter', delay: 40 })
  const [lockHeight, setLockHeight] = useState(0) // keeps the grid's height while cards swap, so the page does not jump
  const [selected, setSelected] = useState(null) // the product shown in the modal
  const [cartOpen, setCartOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const filterTimer = useRef(null)
  const releaseTimer = useRef(null)
  const gridRef = useRef(null)

  // Load the products once
  useEffect(() => {
    let cancelled = false
    getProducts()
      .then((list) => {
        if (!cancelled) setProducts(list)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => () => {
    clearTimeout(filterTimer.current)
    clearTimeout(releaseTimer.current)
  }, [])

  // The header's "My Cart" link opens the panel through ?openCart=true
  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const closeProduct = useCallback(() => setSelected(null), [])
  useOpenFromUrl('openCart', openCart)

  // ...and "Order History" through ?openOrderHistory=true
  const openOrders = useCallback(() => setOrdersOpen(true), [])
  useOpenFromUrl('openOrderHistory', openOrders)

  // Buy Now and Proceed to Checkout
  const checkout = useCheckout({ onCartClose: closeCart })

  // Changing the category: the cards fade out, then the matching ones fade in with a small rise.
  // The grid keeps its height during the swap and then eases to the new height (no jumping).
  const handleFilter = (filter) => {
    if (filter === activeFilter) return
    setActiveFilter(filter)
    setSort('featured') // the old page reset the sort whenever a filter was chosen
    setLockHeight(gridRef.current?.offsetHeight ?? 0)
    setLeaving(true)
    clearTimeout(filterTimer.current)
    clearTimeout(releaseTimer.current)
    filterTimer.current = setTimeout(() => {
      setShownFilter(filter)
      setLeaving(false)
      setCardAnimation({ name: 'card-enter', delay: 40 })
      setRun((n) => n + 1)
      releaseTimer.current = setTimeout(() => setLockHeight(0), 450)
    }, 200)
  }

  const handleSort = (value) => {
    setSort(value)
    setCardAnimation({ name: 'card-enter', delay: 30 })
    setRun((n) => n + 1)
  }

  const matching = products.filter(
    (product) => shownFilter === 'all' || product.type.toLowerCase() === shownFilter,
  )
  const visible = sortProducts(matching, sort)
  const noResults = !loading && !leaving && shownFilter !== 'all' && visible.length === 0

  return (
    <>
      {/* Header Section */}
      <div className="relative z-10 pt-10 pb-6 sm:pt-16 sm:pb-12 w-full">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title and Description */}
          <div className="text-center mb-8 sm:mb-16">
            <h1 className="playfair text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight" style={{ color: '#22306a' }}>
              Luxury Jewelry
            </h1>
            <p className="inter text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our exquisite collection of handcrafted jewelry pieces, each telling a unique story of
              elegance and sophistication.
            </p>
          </div>

          {/* Filter/Sort Bar */}
          {/* Phones: category row on top, sort under it. Wider: side by side like before */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center mb-2 sm:mb-12 gap-4">
            <CategoryFilter active={activeFilter} onChange={handleFilter} />
            <SortSelect value={sort} onChange={handleSort} />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loadError && <p className="inter text-center text-red-600 pb-10">{loadError}</p>}

        {!noResults && (
          <div
            // 2 cards across on phones and small tablets, 3 on iPad Pro and laptops, 4 on wide screens.
            // content-start: rows keep their own height, so a lone card is not stretched to fill the grid
            className="grid content-start grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8 lg:gap-10"
            id="productsGrid"
            ref={gridRef}
            // Lock instantly; only the release to the new height is animated
            style={{ minHeight: lockHeight, transition: lockHeight ? 'none' : 'min-height 0.4s ease' }}
          >
            {visible.map((product, index) => (
              <ProductCard
                key={`${run}-${product.id}`}
                product={product}
                animation={leaving ? 'card-leave' : cardAnimation.name}
                delay={leaving ? 0 : Math.min(index, 8) * cardAnimation.delay} // stagger, but never more than 8 steps
                onOpen={setSelected}
              />
            ))}
          </div>
        )}

        {/* No Products for Filter Message */}
        {noResults && (
          <div id="noFilterProducts" className="text-center pt-2 pb-20 animate-fade-in">
            <div className="relative max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-white to-gray-50 rounded-full flex items-center justify-center luxury-shadow border border-white/50">
                <i className="bx bx-search-alt text-2xl text-blue-600"></i>
              </div>
              <h3 className="playfair text-2xl font-semibold text-gray-700 mb-4">
                No <span id="filterCategoryName">{CATEGORY_NAMES[shownFilter] || 'Items'}</span> Found
              </h3>
            </div>
          </div>
        )}
      </div>

      {/* The cart panel comes before the modal on purpose: like the old page, the modal stays on top of it */}
      <CartPanel open={cartOpen} onClose={closeCart} onCheckout={checkout.checkoutCart} />
      <OrderHistoryPanel open={ordersOpen} onClose={() => setOrdersOpen(false)} />

      {selected && (
        <ProductModal
          product={selected}
          onClose={closeProduct}
          onAddedToCart={openCart}
          onBuyNow={checkout.buyNow}
        />
      )}

      {checkout.profileModalOpen && (
        <ProfileIncompleteModal onClose={checkout.closeProfileModal} onUpdateProfile={checkout.goToProfile} />
      )}

      {checkout.loading && <LoadingOverlay />}
    </>
  )
}
