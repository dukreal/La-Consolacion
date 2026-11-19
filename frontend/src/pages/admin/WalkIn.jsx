import { AlertCircle, ArrowLeft, Banknote, CheckCircle, Receipt, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWalkInProducts, recordWalkInSale } from '../../services/adminService'

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all'
const labelClass = 'text-sm font-bold text-gray-600 uppercase tracking-wider ml-1'

// The four payment cards. `checked` is the border/background when picked (same colors as before).
const METHODS = [
  { value: 'CASH', label: 'Cash', checked: 'peer-checked:border-emerald-500 peer-checked:bg-emerald-50' },
  { value: 'GCASH', label: 'GCash', logo: '/images/gcash-logo.png', checked: 'peer-checked:border-blue-500 peer-checked:bg-blue-50' },
  { value: 'PAYMAYA', label: 'Maya', logo: '/images/maya-logo.png', checked: 'peer-checked:border-emerald-400 peer-checked:bg-emerald-50' },
  { value: 'GOTYME', label: 'GoTyme', logo: '/images/gotyme-logo.png', checked: 'peer-checked:border-pink-500 peer-checked:bg-pink-50' },
]

// "Walk-In Order" point of sale (was admin-walkin.php). Opened from the Orders page.
export default function WalkIn() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [changed, setChanged] = useState(false) // the summary says ₱0.00 until something is picked, like before
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getWalkInProducts()
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message))
  }, [])

  const product = products.find((p) => String(p.id) === productId)
  const price = product?.price ?? 0
  const qty = parseInt(quantity, 10) || 0
  const money = (n) => (changed ? `₱${n.toLocaleString('en-US')}` : '₱0.00')

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

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Walk-In Order</h1>
          <p className="text-gray-600 text-lg">Point of Sale System for physical store purchases</p>
        </div>
        <Link to="/admin/orders" title="Back to Orders" className="p-3 bg-white/50 hover:bg-white rounded-full transition shadow-sm border border-gray-200">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
      </div>

      {error && (
        <div id="walkinError" className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
            <form id="posForm" onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="product_select" className={labelClass}>Select Item</label>
                  <select
                    id="product_select"
                    name="product_id"
                    required
                    value={productId}
                    onChange={(e) => { setProductId(e.target.value); setChanged(true) }}
                    className={`${inputClass} text-lg`}
                  >
                    <option value="">-- Search Jewelry --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₱{p.price.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="quantity_input" className={labelClass}>Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="quantity_input"
                      name="quantity"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => { setQuantity(e.target.value); setChanged(true) }}
                      className={`${inputClass} text-lg`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">pcs</div>
                  </div>
                </div>
              </div>

              {/* 2. Payment method */}
              <div className="space-y-3">
                <span className={labelClass}>Payment Method</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {METHODS.map((m) => (
                    <label key={m.value} className="relative group cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value={m.value}
                        checked={method === m.value}
                        onChange={() => chooseMethod(m.value)}
                        className="peer hidden"
                      />
                      <div className={`p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 ${m.checked} transition-all text-center`}>
                        {m.logo ? (
                          <img src={m.logo} alt="" className="w-8 h-8 mx-auto mb-2 object-contain" />
                        ) : (
                          <Banknote className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                        )}
                        <p className="font-bold text-gray-800 text-sm">{m.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Reference number, only for e-wallets */}
              {method !== 'CASH' && (
                <div id="refField" className="space-y-2">
                  <label htmlFor="reference_number" className={labelClass}>E-Wallet Reference Number</label>
                  <input
                    type="text"
                    id="reference_number"
                    name="reference_number"
                    placeholder="Enter 13-digit Reference #"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold text-xl shadow-xl hover:shadow-gray-400/30 transform transition hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-60"
              >
                <CheckCircle className="w-6 h-6" />
                Complete Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-lg font-semibold mb-6 opacity-80 uppercase tracking-widest">Order Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center opacity-90">
                  <span>Unit Price</span>
                  <span id="summary_price">{money(price)}</span>
                </div>
                <div className="flex justify-between items-center opacity-90">
                  <span>Quantity</span>
                  <span id="summary_qty">{qty}x</span>
                </div>
                <div className="pt-6 mt-6 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <p className="text-sm opacity-70 mb-1">Grand Total</p>
                    <p className="text-4xl font-extrabold" id="summary_total">{money(price * qty)}</p>
                  </div>
                  <Receipt className="w-10 h-10 opacity-30" />
                </div>
              </div>
            </div>
            <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm italic">
              <ShieldCheck className="w-4 h-4 inline mr-1 -mt-1" />
              Completing this sale will immediately update your inventory stock levels.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
