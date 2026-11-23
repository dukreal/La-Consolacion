import { ADDRESS_FIELDS } from '../../utils/address'

// The delivery address form, used at checkout and on the Profile page.
// Phones: one field per row (Province and ZIP share a row). From 480px: two per row, the street and notes across.
//   value / onChange(address): the address (utils/address.js)
//   errors: { key: message } to show under the fields (only pass them after the customer pressed Continue / Save)
//   idPrefix: keeps the ids unique (the error focus uses `${idPrefix}-${key}`)
//   labelClass / inputClass: the page's own label and input styles
const WIDE = new Set(['street', 'notes'])

export default function AddressFields({ value, onChange, errors = {}, idPrefix, labelClass, inputClass, invalidClass = 'invalid' }) {
  const set = (field) => (e) => {
    let next = e.target.value
    if (field.numeric) next = next.replace(/\D/g, '')
    onChange({ ...value, [field.key]: next.slice(0, field.max) })
  }

  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] min-[480px]:grid-cols-2 gap-x-3 gap-y-3.5">
      {ADDRESS_FIELDS.map((field) => {
        const id = `${idPrefix}-${field.key}`
        const error = errors[field.key]
        // Phones: Province and ZIP side by side, every other field across the row
        const span = WIDE.has(field.key) ? 'col-span-2' : field.key === 'province' || field.key === 'zip' ? '' : 'col-span-2 min-[480px]:col-span-1'
        return (
          <div key={field.key} className={`min-w-0 ${span}`}>
            <label htmlFor={id} className={labelClass}>
              {field.label}
              {field.optional && <span className="font-normal opacity-75"> (optional)</span>}
            </label>
            <input
              id={id}
              name={field.autoComplete === 'off' ? undefined : field.key}
              type={field.key === 'mobile' ? 'tel' : 'text'}
              inputMode={field.numeric ? 'numeric' : undefined}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={value[field.key]}
              onChange={set(field)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className={`${inputClass}${error ? ` ${invalidClass}` : ''}`}
            />
            {error && (
              <p id={`${id}-error`} className="text-red-600 text-xs mt-1.5">
                {error}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
