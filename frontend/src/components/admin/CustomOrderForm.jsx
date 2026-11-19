import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImageField from './ProductImageField'

const inputClass =
  'form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// The card with the custom order fields, used by Add Custom Order and Edit Custom Order.
//   mode: 'add' (has the Product Type dropdown) or 'edit' (has the Status dropdown)
//   initial: starting values; imageUrl: the saved picture (Edit only)
//   onSubmit(fields, imageFile): returns PHP's answer; an error is shown above the form
export default function CustomOrderForm({ mode, title, icon: Icon, submitLabel, initial, imageUrl, onSubmit }) {
  const isAdd = mode === 'add'
  const [form, setForm] = useState({
    customerName: initial.customerName ?? '',
    email: initial.email ?? '',
    productName: initial.productName ?? '',
    productType: '',
    price: initial.price ?? '',
    stock: initial.stock ?? '1',
    status: initial.status ?? 'pending',
    description: initial.description ?? '',
  })
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await onSubmit(form, image)
      if (!res.success) setError(res.message || res.error || 'Something went wrong.')
    } catch {
      setError('Network error. Please try again.')
    }
    setSaving(false)
  }

  const priceField = (
    <div>
      <label className="block font-semibold text-gray-700">
        Price
        <input type="number" name="customPrice" step="0.01" min="0" value={form.price} onChange={set('price')} required className={inputClass} />
      </label>
    </div>
  )
  const stockField = (
    <div>
      <label className="block font-semibold text-gray-700">
        Stock
        <input type="number" name="stock" min="1" value={form.stock} onChange={set('stock')} required className={inputClass} />
      </label>
    </div>
  )

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-10">
      <div className="flex items-center gap-3 mb-6">
        <span className={`inline-flex items-center justify-center ${isAdd ? 'bg-blue-100' : 'bg-purple-100'} rounded-full p-2 text-3xl`}>
          <Icon />
        </span>
        <h1 className="text-2xl font-bold tracking-wide m-0">{title}</h1>
      </div>
      {error && <div id="formError" className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <ProductImageField variant={mode} currentUrl={imageUrl} file={image} onChange={setImage} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-gray-700">
              Customer Name
              <input type="text" name="customerName" value={form.customerName} onChange={set('customerName')} required className={inputClass} />
            </label>
          </div>
          <div>
            <label className="block font-semibold text-gray-700">
              Email
              <input type="email" name="customerEmail" value={form.email} onChange={set('email')} required className={inputClass} />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">
              Product Name
              <input type="text" name="productName" value={form.productName} onChange={set('productName')} required className={inputClass} />
            </label>
          </div>
          {isAdd ? (
            <>
              {/* On the old page this dropdown was required but its value was never saved (custom products are type "custom") */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Product Type
                  <select name="productType" value={form.productType} onChange={set('productType')} required className={inputClass}>
                    <option value="">Select Type</option>
                    <option value="Ring">Ring</option>
                    <option value="Earring">Earring</option>
                    <option value="Charm">Charm</option>
                    <option value="Bracelet">Bracelet</option>
                  </select>
                </label>
              </div>
              {priceField}
              {stockField}
            </>
          ) : (
            <>
              {priceField}
              {stockField}
              <div className="md:col-span-2">
                <label className="block font-semibold text-gray-700">
                  Custom Order Status
                  <select name="customStatus" value={form.status} onChange={set('status')} required className={inputClass}>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">
              Description
              <textarea name="customDescription" value={form.description} onChange={set('description')} required className={inputClass} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Link to="/admin/inventory" className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-2 bg-gradient-to-r ${
              isAdd ? 'from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800' : 'from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800'
            } text-white font-bold rounded-lg shadow-lg text-lg transition disabled:opacity-60`}
          >
            {saving && isAdd ? 'Sending...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
