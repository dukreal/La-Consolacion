import { Info } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImageField from './ProductImageField'

const inputClass =
  'form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
const lockedClass = ' bg-gray-100 cursor-not-allowed'
const TYPES = [
  { value: 'ring', label: 'Ring' },
  { value: 'charm', label: 'Charm' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
]

// The card with the premade product fields, used by Add Premade and Edit Product.
//   initial: starting values ({ name, price, stock, type, material, description })
//   imageUrl: the saved picture (Edit only)
//   stockOnly: true for Admins on Edit Product (every field but Stock is locked)
//   onSubmit(fields, imageFile): returns PHP's answer; an error is shown above the form
export default function PremadeProductForm({ title, icon: Icon, submitLabel, variant, initial, imageUrl, stockOnly = false, onSubmit }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    price: initial.price ?? '',
    stock: initial.stock ?? '',
    type: (initial.type ?? '').toLowerCase(),
    material: initial.material ?? '',
    description: initial.description ?? '',
  })
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const lock = stockOnly ? lockedClass : ''

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

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center justify-center bg-blue-100 rounded-full p-2 text-3xl">
          <Icon />
        </span>
        <h1 className="text-2xl font-bold tracking-wide m-0">{title}</h1>
      </div>
      {error && <div id="formError" className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {stockOnly && (
          <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Admin-1 Mode: You can only edit stock quantity</span>
            </div>
          </div>
        )}
        <ProductImageField
          variant={variant}
          currentUrl={imageUrl}
          file={image}
          onChange={setImage}
          editable={!stockOnly}
          required={variant === 'add'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-gray-700">
              Product Name
              <input type="text" name="itemName" value={form.name} onChange={set('name')} disabled={stockOnly} required className={inputClass + lock} />
            </label>
          </div>
          <div>
            <label className="block font-semibold text-gray-700">
              Price
              <input type="number" name="itemPrice" step="0.01" min="0" value={form.price} onChange={set('price')} disabled={stockOnly} required className={inputClass + lock} />
            </label>
          </div>
          <div>
            <label className="block font-semibold text-gray-700">
              Stock
              <input type="number" name="itemStock" min="0" value={form.stock} onChange={set('stock')} required className={inputClass} />
            </label>
          </div>
          <div>
            <label className="block font-semibold text-gray-700">
              Product Type
              <select name="itemType" value={form.type} onChange={set('type')} disabled={stockOnly} required className={inputClass + lock}>
                <option value="">Select type</option>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">
              Material
              <input type="text" name="itemMaterial" value={form.material} onChange={set('material')} disabled={stockOnly} className={inputClass + lock} />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700">
              Description
              <textarea name="itemDescription" value={form.description} onChange={set('description')} disabled={stockOnly} className={inputClass + lock} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Link to="/admin/inventory" className="px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-md font-semibold hover:bg-gray-100 transition">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-md font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
