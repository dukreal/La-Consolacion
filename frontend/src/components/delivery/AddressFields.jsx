import { ADDRESS_FIELDS } from '../../utils/address'

// The delivery address form, used at checkout and on the Profile page.
// Phones: one field per row (Province and ZIP share a row). From 480px: two per row, the street and notes across.
//   value / onChange(address): the address (utils/address.js)
//   errors: { key: message } to show under the fields (only pass them after the customer pressed Continue / Save)
//   idPrefix: keeps the ids unique (the error focus uses `${idPrefix}-${key}`)
//   labelClass / inputClass: the page's own label and input styles
//   roomy: the form has a wide card on desktop (My Account): from lg, Barangay, City, Province and ZIP share one row
//          (City and Province wider, ZIP narrow, so names like "Misamis Oriental" are not cut off)
//   grouped (with roomy, My Account): below lg the fields sit in white groups (Recipient, Address, For the courier)
//          styled by styles/profile.css (.pf-group, .pf-row); from lg the groups disappear and the grid is the same
const WIDE = new Set(['street', 'notes'])

// The groups on phones; each inner list is one row (two keys = side by side)
const GROUPS = [
  { title: 'Recipient', rows: [['name'], ['mobile']] },
  { title: 'Address', rows: [['street'], ['barangay', 'city'], ['province', 'zip']] },
  { title: 'For the courier', rows: [['notes']] },
]

function spanOf(key, roomy) {
  // Phones: Province and ZIP side by side, every other field across the row. From 480px: two per row.
  const base = WIDE.has(key) ? 'col-span-2' : key === 'province' || key === 'zip' ? '' : 'col-span-2 min-[480px]:col-span-1'
  if (!roomy) return base
  return `${base} ${WIDE.has(key) ? 'lg:col-span-4' : key === 'name' || key === 'mobile' ? 'lg:col-span-2' : 'lg:col-span-1'}`
}

export default function AddressFields({ value, onChange, errors = {}, idPrefix, labelClass, inputClass, invalidClass = 'invalid', roomy = false, grouped = false }) {
  const set = (field) => (e) => {
    let next = e.target.value
    if (field.numeric) next = next.replace(/\D/g, '')
    onChange({ ...value, [field.key]: next.slice(0, field.max) })
  }

  // One field: its label, box and error. `className` places it in the grid.
  const renderField = (field, className) => {
    const id = `${idPrefix}-${field.key}`
    const error = errors[field.key]
    return (
      <div key={field.key} className={`min-w-0 ${className}`}>
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
  }

  if (grouped) {
    const byKey = Object.fromEntries(ADDRESS_FIELDS.map((field) => [field.key, field]))
    // From lg: the same spans as `roomy` (Name and Mobile half each, Street and Notes across, the other four in one row)
    const lgSpan = (key) => (WIDE.has(key) ? 'lg:col-span-4' : key === 'name' || key === 'mobile' ? 'lg:col-span-2' : 'lg:col-span-1')
    return (
      <div className="grid grid-cols-1 gap-y-5 lg:gap-x-3 lg:gap-y-3 lg:grid-cols-[1fr_1.35fr_1.35fr_0.7fr]">
        {GROUPS.map((group) => (
          <div key={group.title} className="lg:contents">
            <h3 className="pf-heading lg:hidden">{group.title}</h3>
            <div className="pf-group lg:contents">
              {group.rows.map((keys) =>
                keys.length === 1 ? (
                  renderField(byKey[keys[0]], `pf-row ${lgSpan(keys[0])}`)
                ) : (
                  <div key={keys.join('-')} className={`pf-pair lg:contents${keys.includes('zip') ? ' pf-pair-wide' : ''}`}>
                    {keys.map((key) => renderField(byKey[key], `pf-row ${lgSpan(key)}`))}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] min-[480px]:grid-cols-2 gap-x-3 gap-y-3.5 lg:gap-y-3${roomy ? ' lg:grid-cols-[1fr_1.35fr_1.35fr_0.7fr]' : ''}`}>
      {ADDRESS_FIELDS.map((field) => renderField(field, spanOf(field.key, roomy)))}
    </div>
  )
}
