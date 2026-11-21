import { Edit3, Package, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Skeleton, { LoadingArea } from '../../components/admin/Skeleton'
import Toast from '../../components/admin/Toast'
import { useAuth } from '../../hooks/useAuth'
import { useDialog } from '../../hooks/useDialog'
import { refreshingClass, useRefreshing } from '../../hooks/useRefreshing'
import { deleteProduct, getInventory } from '../../services/adminService'
import { cancelButton, dangerButton } from '../../utils/dialogButtons'

const PREMADE_TYPES = ['ring', 'charm', 'earring', 'bracelet']
const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ring', label: 'Ring' },
  { value: 'charm', label: 'Charm' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
]
const PLURAL = { ring: 'rings', charm: 'charms', earring: 'earrings', bracelet: 'bracelets' }

// Premade / Custom switch (navy when chosen) and the type chips (light navy when chosen)
const segmentBtnClass = (active) =>
  `px-3 sm:px-4 h-9 rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40 ${
    active ? 'bg-[#22306a] text-white shadow-sm active' : 'text-gray-600 hover:text-[#22306a]'
  }`
const chipBtnClass = (active) =>
  `flex-shrink-0 px-3.5 h-8 rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40 ${
    active ? 'bg-[#eef1f8] border-[#22306a] text-[#22306a] active' : 'bg-white border-gray-300 text-gray-700 hover:border-[#22306a]/50'
  }`

const isCustom = (p) => !PREMADE_TYPES.includes(p.type.toLowerCase())
const peso = (n) => '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Every card is the same size: the name always gets a two-line space and longer names end with "…"
function ProductCard({ product, canDelete, onDelete }) {
  const custom = isCustom(product)
  // Custom products have their own image folder and their own edit page
  const imageSrc = `/uploads/${product.type.toLowerCase() === 'custom' ? 'custom' : 'products'}/${product.image}`
  const editLink = custom ? `/admin/inventory/edit-custom/${product.id}` : `/admin/inventory/edit-premade/${product.id}`
  const inStock = product.stock > 0

  return (
    <div
      className="product-card bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3 flex flex-col min-w-0"
      data-type={product.type.toLowerCase()}
    >
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#f5f7fb]">
        <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#2474b6] truncate">{ucfirst(product.type)}</p>
      <h3 className="mt-0.5 h-[2.75em] text-sm sm:text-base font-bold leading-snug text-[#22306a] line-clamp-2 break-words" title={product.name}>
        {product.name}
      </h3>
      <div className="mt-1 text-base sm:text-lg font-bold text-gray-900">{peso(product.price)}</div>
      <div className="mt-1.5">
        <span
          className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
            inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {inStock ? `${product.stock} in stock` : 'Out of stock'}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          to={editLink}
          className="editProductBtn flex-1 h-9 rounded-lg border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors flex items-center justify-center gap-1.5"
        >
          <Edit3 className="w-4 h-4" /> Edit
        </Link>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(product)}
            aria-label={`Delete ${product.name}`}
            title="Delete"
            className="deleteProductBtn w-9 h-9 flex-shrink-0 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Placeholder shown until the products arrive, the same size as a ProductCard
function ProductCardSkeleton({ canDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3 flex flex-col min-w-0">
      <Skeleton className="w-full aspect-square !rounded-lg" />
      <div className="mt-2.5 h-[1rem] flex items-center"><Skeleton className="h-2.5 w-12" /></div>
      <div className="mt-0.5 h-[2.75em] text-sm sm:text-base leading-snug pt-[0.2em] space-y-[0.4em]">
        <Skeleton className="h-[0.9em] w-11/12" />
        <Skeleton className="h-[0.9em] w-1/2" />
      </div>
      <div className="mt-1 h-6 sm:h-7 flex items-center"><Skeleton className="h-4 sm:h-5 w-24" /></div>
      <Skeleton className="mt-1.5 h-5 w-20" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="flex-1 h-9 !rounded-lg" />
        {canDelete && <Skeleton className="w-9 h-9 flex-shrink-0 !rounded-lg" />}
      </div>
    </div>
  )
}

function DeleteModal({ product, deleting, onCancel, onConfirm }) {
  const box = useRef(null)
  useDialog(box, () => !deleting && onCancel()) // Escape = Cancel; focus starts on Cancel
  return (
    <div
      id="deleteModal"
      className="fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()} // click outside closes it
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deleteModalTitle"
        aria-describedby="deleteModalText"
        tabIndex={-1}
        className="bg-white rounded-[18px] border border-[#eef0f5] p-6 max-w-md w-full shadow-[0_12px_40px_rgba(34,48,106,0.18)] outline-none"
      >
        <h3 id="deleteModalTitle" className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
        <p id="deleteModalText" className="text-gray-600 mb-6">
          Are you sure you want to delete <span id="deleteProductName" className="font-semibold text-red-600">{product.name}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button id="cancelDelete" type="button" onClick={onCancel} disabled={deleting} data-autofocus className={cancelButton}>
            Cancel
          </button>
          <button id="confirmDelete" type="button" onClick={onConfirm} disabled={deleting} className={dangerButton}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { user: me } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('premade') // 'premade' or 'custom'
  const [type, setType] = useState('') // '' = All, or 'ring', 'charm', ...
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reloading, setReloading] = useState(false) // getting the list again after a delete
  const refreshing = useRefreshing(reloading)
  // A message passed from another page (e.g. after saving a product) shows once
  const [toast, setToast] = useState(() => location.state?.toast ?? null)

  const load = useCallback(() => {
    return getInventory()
      .then((d) => { setData(d); setError('') })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  // Clear the passed message so a page refresh does not show it again
  useEffect(() => {
    if (location.state?.toast) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  const showToast = (color, text, duration) => setToast({ id: Date.now(), color, text, duration })

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      const res = await deleteProduct(toDelete.id)
      if (res.success) {
        showToast('green', 'Product removed from inventory successfully!', 2000)
        setReloading(true)
        await load()
        setReloading(false)
      } else if (res.error === 'level') {
        showToast('red', 'Insufficient permissions to delete products. Only SuperAdmin can delete products.', 3000)
      } else {
        showToast('red', res.message || res.error || 'Failed to delete product', 5000)
      }
    } catch {
      showToast('red', 'Network error. Please try again.', 5000)
    }
    setDeleting(false)
    setToDelete(null)
  }

  const chooseProductType = (value) => {
    setProductType(value)
    if (value === 'custom') setType('') // type buttons are switched off for custom, back to "All"
  }

  const loading = !data && !error
  const products = data?.products ?? []
  // Known from the sign-in straight away, so the Add buttons do not pop in after loading
  const isSuperAdmin = (data?.adminLevel ?? Number(me?.adminLevel)) === 2
  const q = search.trim().toLowerCase()
  const visible = products.filter((p) => {
    if (productType === 'custom' ? !isCustom(p) : isCustom(p)) return false
    if (type && p.type.toLowerCase() !== type) return false
    // The old page searched all the text on the card
    const cardText = [p.name, peso(p.price), p.type, p.stock > 0 ? 'In Stock' : 'Out of Stock', `Stock: ${p.stock}`].join(' ')
    return cardText.toLowerCase().includes(q)
  })

  let emptyMessage = 'No products found.'
  if (productType === 'premade' && type && q === '') {
    const hasType = products.some((p) => p.type.toLowerCase() === type)
    emptyMessage = hasType ? `No ${PLURAL[type]} found.` : `No ${PLURAL[type]} to display.`
  }

  return (
    <>
      {/* Title and subtitle laid out exactly like the Overview and Orders pages. The add buttons sit beside them
          from 640px; on phones there is no room for two buttons beside the title, so they get their own row under
          the subtitle, sharing the width. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>Inventory</h1>
          <p className="text-gray-600 text-sm sm:text-lg">Manage and track all products in your inventory</p>
        </div>
        {isSuperAdmin && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0">
            <Link
              to="/admin/inventory/add-premade"
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-11 px-3 sm:px-5 rounded-xl bg-[#22306a] hover:bg-[#1a2550] text-white text-sm sm:text-base font-bold shadow-md transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Premade
            </Link>
            <Link
              to="/admin/inventory/add-custom"
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-11 px-3 sm:px-5 rounded-xl border-[1.5px] border-[#22306a] bg-white text-[#22306a] text-sm sm:text-base font-bold hover:bg-[#f5f6fa] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Custom
            </Link>
          </div>
        )}
      </div>

      {/* Search, the Premade / Custom switch and the type chips share one line when there is room; otherwise the
          chips (and on narrow phones the switch too) move to the next line. The chips slide sideways on phones. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mb-5">
        <div className="relative flex-1 basis-[9rem] sm:basis-[16rem] min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="inventorySearch"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#d8dce8] bg-white text-base outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15"
          />
        </div>
        <div id="productTypeFilterBtns" className="flex flex-shrink-0 p-0.5 rounded-lg bg-[#e4e9f2]">
          {['premade', 'custom'].map((value) => (
            <button
              key={value}
              type="button"
              data-product-type={value}
              onClick={() => chooseProductType(value)}
              className={`product-type-filter-btn ${segmentBtnClass(productType === value)}`}
            >
              {ucfirst(value)}
            </button>
          ))}
        </div>
        <div id="typeFilterBtns" className="flex gap-2 min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              data-type={f.value}
              disabled={productType === 'custom'}
              onClick={() => setType(f.value)}
              className={`type-filter-btn ${chipBtnClass(type === f.value)} ${productType === 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <Toast key={toast.id} color={toast.color} duration={toast.duration}>
          {toast.check ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{toast.text}</span>
            </div>
          ) : (
            toast.text
          )}
        </Toast>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* 2 cards per row on phones, 3 on tablets, then as many as fit (each at least 11.5rem wide) */}
      <div className={`bg-white p-3 sm:p-5 rounded-2xl shadow-lg border border-blue-100 ${refreshingClass(refreshing)}`} aria-busy={refreshing || undefined}>
        {loading && (
          <LoadingArea label="Loading products…" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <ProductCardSkeleton key={n} canDelete={isSuperAdmin} />)}
          </LoadingArea>
        )}
        <div id="inventoryGrid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-3 sm:gap-4">
          {data && products.length === 0 && (
            <div className="col-span-full text-center text-gray-400 text-xl sm:text-2xl py-16 sm:py-24">No products are added.</div>
          )}
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} canDelete={isSuperAdmin} onDelete={setToDelete} />
          ))}
          {products.length > 0 && visible.length === 0 && (
            <div id="noProductsFound" className="col-span-full flex flex-col items-center justify-center text-center text-gray-400 text-2xl py-16 sm:py-24">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 id="noProductsHeadline" className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">{emptyMessage}</h3>
              <p className="text-gray-500 text-base">Products will appear here when you add them.</p>
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <DeleteModal product={toDelete} deleting={deleting} onCancel={() => setToDelete(null)} onConfirm={handleConfirmDelete} />
      )}
    </>
  )
}
