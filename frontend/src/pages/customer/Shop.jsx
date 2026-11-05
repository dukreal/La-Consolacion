import { useCallback, useEffect, useRef, useState } from 'react'
import CartPanel from '../../components/cart/CartPanel'
import CategoryFilter from '../../components/shop/CategoryFilter'
import ProductCard from '../../components/shop/ProductCard'
import ProductModal from '../../components/shop/ProductModal'
import SortSelect from '../../components/shop/SortSelect'
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
  const [cardAnimation, setCardAnimation] = useState({ name: 'fade-in', delay: 0 })
  const [selected, setSelected] = useState(null) // the product shown in the modal
  const [cartOpen, setCartOpen] = useState(false)
  const filterTimer = useRef(null)

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

  useEffect(() => () => clearTimeout(filterTimer.current), [])

  // The header's "My Cart" link opens the panel through ?openCart=true
  const openCart = useCallback(() => setCartOpen(true), [])
  useOpenFromUrl('openCart', openCart)

  // Same animation as the old page: cards slide out, then the matching ones slide in one by one
  const handleFilter = (filter) => {
    setActiveFilter(filter)
    setSort('featured') // the old page reset the sort whenever a filter was chosen
    setLeaving(true)
    clearTimeout(filterTimer.current)
    filterTimer.current = setTimeout(() => {
      setShownFilter(filter)
      setLeaving(false)
      setCardAnimation({ name: 'slide-in-left', delay: 50 })
      setRun((n) => n + 1)
    }, 350)
  }

  const handleSort = (value) => {
    setSort(value)
    setCardAnimation({ name: 'slide-in-left', delay: 30 })
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
      <div className="relative z-10 pt-16 pb-12 w-full">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title and Description */}
          <div className="text-center mb-16">
            <h1 className="playfair text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#22306a' }}>
              Luxury Jewelry
            </h1>
            <p className="inter text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our exquisite collection of handcrafted jewelry pieces, each telling a unique story of
              elegance and sophistication.
            </p>
          </div>

          {/* Filter/Sort Bar */}
          <div className="flex flex-wrap justify-between items-center mb-12 gap-4">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10"
            id="productsGrid"
          >
            {visible.map((product, index) => (
              <ProductCard
                key={`${run}-${product.id}`}
                product={product}
                animation={leaving ? 'slide-out' : cardAnimation.name}
                delay={leaving ? 0 : index * cardAnimation.delay}
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
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} onAddedToCart={openCart} />
      )}
    </>
  )
}
