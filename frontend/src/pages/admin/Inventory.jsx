import { Edit3, Package, Settings, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Toast from '../../components/admin/Toast'
import { deleteProduct, getInventory } from '../../services/adminService'

const PREMADE_TYPES = ['ring', 'charm', 'earring', 'bracelet']
const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ring', label: 'Ring' },
  { value: 'charm', label: 'Charm' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
]
const PLURAL = { ring: 'rings', charm: 'charms', earring: 'earrings', bracelet: 'bracelets' }

const filterBtnClass = (active) =>
  `px-4 py-2 rounded-lg border border-gray-300 font-semibold shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none ${
    active ? 'bg-blue-500 text-white active' : 'bg-white text-gray-700'
  }`

const isCustom = (p) => !PREMADE_TYPES.includes(p.type.toLowerCase())
const peso = (n) => '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function ProductCard({ product, canDelete, onDelete }) {
  const custom = isCustom(product)
  // Custom products have their own image folder and their own edit page
  const imageSrc = `/uploads/${product.type.toLowerCase() === 'custom' ? 'custom' : 'products'}/${product.image}`
  const editLink = custom ? `/admin/inventory/edit-custom/${product.id}` : `/admin/inventory/edit/${product.id}`

  return (
    <div
      className="product-card glass bg-white/60 backdrop-blur-md border border-blue-100 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full relative overflow-hidden"
      data-type={product.type.toLowerCase()}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(circle at 70% 20%, #a5b4fc22 0%, #f0f9ff00 80%)' }}
      />
      <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 border-b border-blue-200 mb-5 rounded-xl overflow-hidden shadow-lg">
        <img
          src={imageSrc}
          alt={product.name}
          className="object-cover w-full h-full border-4 border-white rounded-xl shadow-md transition-transform duration-200 hover:scale-105"
          style={{ display: 'block' }}
        />
      </div>
      <h3 className="text-xl font-extrabold text-blue-900 mb-1 truncate" title={product.name}>{product.name}</h3>
      <div className="text-lg font-bold text-gray-900 mb-2">{peso(product.price)}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-200 to-blue-100 text-blue-800 shadow-sm">
          {ucfirst(product.type)}
        </span>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
            product.stock > 0
              ? 'bg-gradient-to-r from-emerald-200 to-emerald-100 text-emerald-800'
              : 'bg-gradient-to-r from-red-200 to-red-100 text-red-800'
          }`}
        >
          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 shadow-sm">
          Stock: {product.stock}
        </span>
      </div>
      <div className="flex justify-between items-center mt-auto pt-4 gap-3">
        <Link
          to={editLink}
          className="editProductBtn flex-1 px-5 py-2.5 rounded-lg text-white text-base font-bold bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" /> Edit
        </Link>
        {canDelete && (
          <div className="flex-1">
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="deleteProductBtn w-full px-5 py-2.5 rounded-lg text-base font-bold bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DeleteModal({ product, deleting, onCancel, onConfirm }) {
  return (
    <div
      id="deleteModal"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onCancel()} // click outside closes it
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span id="deleteProductName" className="font-semibold text-red-600">{product.name}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button id="cancelDelete" type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition">
            Cancel
          </button>
          <button
            id="confirmDelete"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('premade') // 'premade' or 'custom'
  const [type, setType] = useState('') // '' = All, or 'ring', 'charm', ...
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
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
        await load()
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

  const products = data?.products ?? []
  const isSuperAdmin = data?.adminLevel === 2
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
      <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ letterSpacing: '-0.01em' }}>Inventory</h1>
      <p className="text-gray-600 text-lg mb-6">Manage and track all products in your inventory</p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <input
            id="inventorySearch"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm"
            style={{ maxWidth: '100%' }}
          />
          <div id="productTypeFilterBtns" className="flex gap-2 ml-2">
            {['premade', 'custom'].map((value) => (
              <button
                key={value}
                type="button"
                data-product-type={value}
                onClick={() => chooseProductType(value)}
                className={`product-type-filter-btn ${filterBtnClass(productType === value)}`}
              >
                {ucfirst(value)}
              </button>
            ))}
          </div>
          <div id="typeFilterBtns" className="flex gap-2 ml-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                data-type={f.value}
                disabled={productType === 'custom'}
                onClick={() => setType(f.value)}
                className={`type-filter-btn ${filterBtnClass(type === f.value)} ${productType === 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-4">
            <Link
              to="/admin/inventory/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold shadow-lg hover:from-emerald-600 hover:to-blue-600 transition text-lg"
            >
              <Package className="w-6 h-6" />
              Add Premade
            </Link>
            <Link
              to="/admin/inventory/add-custom"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition text-lg"
            >
              <Settings className="w-6 h-6" />
              Add Custom
            </Link>
          </div>
        )}
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

      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-blue-100">
        <div id="inventoryGrid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {data && products.length === 0 && (
            <div className="col-span-full text-center text-gray-400 text-2xl py-24">No products are added.</div>
          )}
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} canDelete={isSuperAdmin} onDelete={setToDelete} />
          ))}
          {products.length > 0 && visible.length === 0 && (
            <div id="noProductsFound" className="col-span-full flex flex-col items-center justify-center text-center text-gray-400 text-2xl py-24">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 id="noProductsHeadline" className="text-2xl font-semibold text-gray-600 mb-2">{emptyMessage}</h3>
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
