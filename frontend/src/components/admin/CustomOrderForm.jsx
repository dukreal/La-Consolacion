import { useState } from 'react'
import { fieldClass, labelClass, textareaClass } from '../../utils/adminForm'
import ProductFormLayout, { FormSection } from './ProductFormLayout'
import ProductImageField from './ProductImageField'

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// The custom order form, used by Add Custom Order and Edit Custom Order.
//   mode: 'add' (has the Product Type dropdown) or 'edit' (has the Status dropdown)
//   initial: starting values; imageUrl: the saved picture (Edit only)
//   onSubmit(fields, imageFile): returns PHP's answer; an error is shown above the form
export default function CustomOrderForm({ mode, title, subtitle, submitLabel, initial, imageUrl, onSubmit }) {
  const isAdd = mode === 'add'
  const [form, setForm] = useState({
    customerName: initial.customerName ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
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
  // Phone: digits only (spaces and dashes are dropped as you type), at most 11
  const setPhone = (e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })

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
    <label className={labelClass}>
      Price (₱)
      <input type="number" name="customPrice" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={set('price')} required className={fieldClass} />
    </label>
  )
  const stockField = (
    <label className={labelClass}>
      Stock
      <input type="number" name="stock" min="1" value={form.stock} onChange={set('stock')} required className={fieldClass} />
    </label>
  )

  return (
    <ProductFormLayout
      title={title}
      subtitle={subtitle}
      error={error}
      saving={saving}
      savingLabel={isAdd ? 'Sending...' : ''}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      photo={<ProductImageField variant={mode} currentUrl={imageUrl} file={image} onChange={setImage} />}
      aside={
        <FormSection title={isAdd ? 'Price and stock' : 'Price, stock and status'} grid="sm:grid-cols-3 xl:grid-cols-1">
          {isAdd && (
            // On the old page this dropdown was required but its value was never saved (custom products are type "custom")
            <label className={labelClass}>
              Product Type
              <select name="productType" value={form.productType} onChange={set('productType')} required className={fieldClass}>
                <option value="">Select Type</option>
                <option value="Ring">Ring</option>
                <option value="Earring">Earring</option>
                <option value="Charm">Charm</option>
                <option value="Bracelet">Bracelet</option>
              </select>
            </label>
          )}
          {priceField}
          {stockField}
          {!isAdd && (
            <label className={labelClass}>
              Custom Order Status
              <select name="customStatus" value={form.status} onChange={set('status')} required className={fieldClass}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          )}
        </FormSection>
      }
    >
      <FormSection title="Details">
        <label className={labelClass}>
          Customer Name
          <input type="text" name="customerName" placeholder="Full name" value={form.customerName} onChange={set('customerName')} required className={fieldClass} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" name="customerEmail" placeholder="name@gmail.com" value={form.email} onChange={set('email')} required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span>
            Phone <span className="font-normal text-gray-400">(optional)</span>
          </span>
          <input
            type="tel"
            name="customerPhone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09171234567"
            pattern="\d{11}"
            title="11 digits, like 09171234567"
            value={form.phone}
            onChange={setPhone}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Product Name
          <input type="text" name="productName" placeholder="e.g. Engraved Name Pendant" value={form.productName} onChange={set('productName')} required className={fieldClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <textarea name="customDescription" rows={2} value={form.description} onChange={set('description')} required className={textareaClass} />
        </label>
      </FormSection>
    </ProductFormLayout>
  )
}
