import { Banknote, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormSection } from '../../components/admin/ProductFormLayout'
import { getWalkInProducts, recordWalkInSale } from '../../services/adminService'
import { fieldClass, labelClass } from '../../utils/adminForm'

// The four ways to pay (same values the server expects)
const METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH', label: 'GCash', logo: '/images/gcash-logo.png' },
  { value: 'PAYMAYA', label: 'Maya', logo: '/images/maya-logo.png' },
  { value: 'GOTYME', label: 'GoTyme', logo: '/images/gotyme-logo.png' },
]

// ₱5,000 for whole amounts, ₱5,499.50 when there are centavos (the same way everywhere on the page)
const peso = (n) => `₱${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

// Same buttons as the product forms
const cancelClass =
  'h-11 px-5 rounded-[10px] border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] transition-colors flex items-center justify-center'
const saveClass =
  'min-h-11 px-4 sm:px-6 py-2 rounded-[10px] bg-[#22306a] [@media(hover:hover)]:hover:bg-[#1a2550] text-white font-semibold leading-tight transition-colors disabled:opacity-60'
const stepClass =
  'w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-[10px] border border-[#d8dce8] bg-white text-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors'

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-800 text-right min-w-0 break-words">{children}</span>
    </div>
  )
}

// "Walk-in Order": records a sale made in the physical store (opened from the Orders page).
// Layout, like the product forms:
//   1024px and up: the form on the left, the summary with Complete Sale / Cancel on the right.
//   Under 1024px: the summary under the form, and the total with Cancel / Complete Sale pinned just above the
//   bottom bar, so the total and the button are always in view.
export default function WalkIn() {
  const navigate = useNavigate()
  const [products, setProducts] = useState(null) // null until the jewelry list has loaded
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getWalkInProducts()
      .then((d) => setProducts(d.products))
      .catch((e) => {
        setProducts([]) // stop saying "Loading jewelry…"; the error shows above the form
        setError(e.message)
      })
  }, [])

  const product = (products ?? []).find((p) => String(p.id) === productId)
  const stock = product?.stock ?? 0
  const qty = parseInt(quantity, 10) || 0
  const total = product ? product.price * qty : 0
  const methodLabel = METHODS.find((m) => m.value === method).label

  const chooseProduct = (id) => {
    setProductId(id)
    const picked = (products ?? []).find((p) => String(p.id) === id)
    // Not more than this item has in stock
    if (picked && qty > picked.stock) setQuantity(String(picked.stock))
  }
  const step = (by) => setQuantity(String(Math.min(Math.max(1, qty + by), stock || 1)))
  // Typing: keep what was typed (so it can be cleared and retyped); fix it when leaving the box
  const fixQuantity = () => setQuantity(String(Math.min(Math.max(1, qty), stock || Math.max(1, qty))))

  const chooseMethod = (value) => {
    setMethod(value)
    if (value === 'CASH') setReference('') // cash has no reference number
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await recordWalkInSale({ productId, quantity, method, reference })
      if (res.success) {
        navigate('/admin/orders', { state: { walkinSuccess: true } }) // Orders shows "Sale Recorded!"
        return
      }
      setError(res.message || res.error || 'Something went wrong.')
    } catch {
      setError('Network error. Please try again.')
    }
    setSaving(false)
  }

  const submitLabel = saving ? 'Saving...' : 'Complete Sale'
  const noStock = products && products.length === 0 && !error

  return (
    <form id="posForm" onSubmit={handleSubmit} className="pb-[calc(4.25rem+1px)] lg:pb-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>Walk-in Order</h1>
        <p className="text-gray-600 text-sm sm:text-lg">Record a sale made in the store</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] gap-4 sm:gap-6 items-start">
        {/* The sale */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-5 space-y-6">
          {error && (
            <div id="walkinError" role="alert" className="p-3 rounded-[10px] border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <FormSection title="Item" grid="sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)]">
            <div className="min-w-0">
              <label htmlFor="product_select" className={labelClass}>Jewelry</label>
              <select
                id="product_select"
                name="product_id"
                required
                disabled={!products || noStock}
                value={productId}
                onChange={(e) => chooseProduct(e.target.value)}
                className={fieldClass}
              >
                <option value="">{!products ? 'Loading jewelry…' : noStock ? 'No jewelry in stock' : 'Choose an item'}</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {peso(p.price)}
                  </option>
                ))}
              </select>
              <p id="itemInfo" className="mt-1.5 text-sm text-gray-500 min-h-[1.25rem]">
                {product && (
                  <>
                    {peso(product.price)} each ·{' '}
                    <span className={product.stock <= 2 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                      {product.stock} in stock
                    </span>
                  </>
                )}
              </p>
            </div>

            <div>
              <label htmlFor="quantity_input" className={labelClass}>Quantity</label>
              <div className="mt-1.5 flex items-center gap-2">
                <button type="button" onClick={() => step(-1)} disabled={!product || qty <= 1} aria-label="One less" className={stepClass}>
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  id="quantity_input"
                  name="quantity"
                  inputMode="numeric"
                  min="1"
                  max={stock || undefined}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={fixQuantity}
                  className={`${fieldClass} !mt-0 min-w-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <button type="button" onClick={() => step(1)} disabled={!product || qty >= stock} aria-label="One more" className={stepClass}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </FormSection>

          <section>
            <h2 id="payLabel" className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#2474b6]">Payment</h2>
            <div role="radiogroup" aria-labelledby="payLabel" className="grid grid-cols-4 gap-2 sm:gap-3">
              {METHODS.map((m) => (
                <label key={m.value} className="cursor-pointer min-w-0">
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.value}
                    checked={method === m.value}
                    onChange={() => chooseMethod(m.value)}
                    className="peer sr-only"
                  />
                  <span className="flex flex-col items-center justify-center gap-1.5 h-full min-h-[4.25rem] px-1 py-2.5 rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-center transition-colors [@media(hover:hover)]:hover:border-[#c5cde0] peer-checked:border-[#2474b6] peer-checked:bg-[#eef5fc] peer-focus-visible:ring-4 peer-focus-visible:ring-[#2474b6]/15">
                    {m.logo ? (
                      <img src={m.logo} alt="" className="w-7 h-7 object-contain rounded-md" />
                    ) : (
                      <Banknote className="w-7 h-7 text-emerald-600" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight break-words">{m.label}</span>
                  </span>
                </label>
              ))}
            </div>

            {/* Reference number, only for e-wallets */}
            {method !== 'CASH' && (
              <div id="refField" className="mt-4">
                <label htmlFor="reference_number" className={labelClass}>{methodLabel} reference number</label>
                <input
                  type="text"
                  id="reference_number"
                  name="reference_number"
                  placeholder="13-digit reference number"
                  autoComplete="off"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}
          </section>
        </div>

        {/* Summary (beside the form from 1024px, under it below that) */}
        <aside className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-5 lg:sticky lg:top-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#2474b6]">Summary</h2>
          <div className="space-y-2">
            <SummaryRow label="Item"><span id="summary_item">{product ? product.name : <span className="text-gray-400">None yet</span>}</span></SummaryRow>
            <SummaryRow label="Price each"><span id="summary_price">{product ? peso(product.price) : '—'}</span></SummaryRow>
            <SummaryRow label="Quantity"><span id="summary_qty">× {qty}</span></SummaryRow>
            <SummaryRow label="Payment"><span id="summary_method">{methodLabel}</span></SummaryRow>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline justify-between gap-3">
            <span className="font-semibold text-gray-800">Total</span>
            <span id="summary_total" className="text-2xl sm:text-3xl font-bold text-[#22306a]">{peso(total)}</span>
          </div>

          {/* 1024px and up: the buttons are here */}
          <div className="hidden lg:grid gap-3 mt-5">
            <button type="submit" disabled={saving} className={saveClass}>{submitLabel}</button>
            <Link to="/admin/orders" className={cancelClass}>Cancel</Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">The sale is saved as a completed order, and the stock goes down right away.</p>
        </aside>
      </div>

      {/* Under 1024px: the total and the buttons pinned right on top of the bottom bar (3.125rem + 12px is its height);
          the form gets matching space at its end so the summary can still scroll above them */}
      <div className="lg:hidden fixed inset-x-0 z-30 bottom-[calc(3.125rem+12px+env(safe-area-inset-bottom))] px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs text-gray-500">Total</div>
            <div id="bar_total" className="text-lg font-bold text-[#22306a] truncate">{peso(total)}</div>
          </div>
          <Link to="/admin/orders" className={`${cancelClass} !px-4`}>Cancel</Link>
          <button type="submit" disabled={saving} className={`${saveClass} whitespace-nowrap`}>{submitLabel}</button>
        </div>
      </div>
    </form>
  )
}
