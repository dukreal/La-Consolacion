import { Info } from 'lucide-react'
import { useState } from 'react'
import { fieldClass, labelClass, textareaClass } from '../../utils/adminForm'
import ProductFormLayout, { FormSection } from './ProductFormLayout'
import ProductImageField from './ProductImageField'

const TYPES = [
  { value: 'ring', label: 'Ring' },
  { value: 'charm', label: 'Charm' },
  { value: 'earring', label: 'Earring' },
  { value: 'bracelet', label: 'Bracelet' },
]

// The premade product form, used by Add Premade and Edit Premade.
//   initial: starting values ({ name, price, stock, type, material, description })
//   imageUrl: the saved picture (Edit only)
//   stockOnly: true for Admins on Edit Premade (every field but Stock is locked)
//   onSubmit(fields, imageFile): returns PHP's answer; an error is shown above the form
export default function PremadeProductForm({ title, subtitle, submitLabel, variant, initial, imageUrl, stockOnly = false, onSubmit }) {
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

  const notice = stockOnly && (
    <div className="mb-5 p-3 rounded-[10px] border border-[#c9dcf1] bg-[#eef4fb] flex items-center gap-2">
      <Info className="w-5 h-5 flex-shrink-0 text-[#1f5f99]" />
      <span className="text-[#1f5f99] font-medium">Admin-1 Mode: You can only edit stock quantity</span>
    </div>
  )

  return (
    <ProductFormLayout
      title={title}
      subtitle={subtitle}
      error={error}
      notice={notice}
      saving={saving}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      photo={
        <ProductImageField variant={variant} currentUrl={imageUrl} file={image} onChange={setImage} editable={!stockOnly} required={variant === 'add'} />
      }
      aside={
        <FormSection title="Price and stock" grid="sm:grid-cols-2 xl:grid-cols-1">
          <label className={labelClass}>
            Price (₱)
            <input type="number" name="itemPrice" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={set('price')} disabled={stockOnly} required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Stock
            <input type="number" name="itemStock" min="0" placeholder="0" value={form.stock} onChange={set('stock')} required className={fieldClass} />
          </label>
        </FormSection>
      }
    >
      <FormSection title="Details">
        <label className={labelClass}>
          Product Name
          <input type="text" name="itemName" placeholder="e.g. Crown Diamond Ring" value={form.name} onChange={set('name')} disabled={stockOnly} required className={fieldClass} />
        </label>
        <label className={labelClass}>
          Product Type
          <select name="itemType" value={form.type} onChange={set('type')} disabled={stockOnly} required className={fieldClass}>
            <option value="">Select type</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Material
          <input type="text" name="itemMaterial" placeholder="e.g. 18k gold" value={form.material} onChange={set('material')} disabled={stockOnly} className={fieldClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <textarea name="itemDescription" rows={2} value={form.description} onChange={set('description')} disabled={stockOnly} className={textareaClass} />
        </label>
      </FormSection>
    </ProductFormLayout>
  )
}
