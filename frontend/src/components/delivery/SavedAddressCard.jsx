import { useState } from 'react'
import { saveAddress } from '../../services/profileService'
import { EMPTY_ADDRESS, toAddress, validateAddress } from '../../utils/address'
import AddressFields from './AddressFields'

// The "Delivery address" section of My Account (pages/customer/Profile.jsx): the address used for delivery by
// courier at checkout, with its own Save and Remove buttons. The page draws the card and the title around it.
//   initial: the saved address from getProfile() (or null)
//   defaults: { name, mobile } to start an empty form with
//   onSaved(address | null): tells the page, so switching sections does not show an old address
export default function SavedAddressCard({ initial, defaults, onSaved }) {
  const [saved, setSaved] = useState(initial ? toAddress(initial) : null)
  const [form, setForm] = useState(initial ? toAddress(initial) : { ...EMPTY_ADDRESS, ...defaults })
  const [showErrors, setShowErrors] = useState(false)
  const [serverErrors, setServerErrors] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const errors = validateAddress(form)

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setServerErrors([])
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      const first = Object.keys(EMPTY_ADDRESS).find((key) => errors[key])
      document.getElementById(`profileAddress-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      const data = await saveAddress(form)
      if (data.success) {
        setSaved(toAddress(data.address))
        setForm(toAddress(data.address))
        setShowErrors(false)
        setMessage('Your delivery address has been saved.')
        onSaved?.(data.address)
      } else {
        setServerErrors(data.errors || ['Could not save the address.'])
      }
    } catch {
      setServerErrors(['Could not reach the server. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setMessage('')
    setServerErrors([])
    setBusy(true)
    try {
      const data = await saveAddress(null, { clear: true })
      if (data.success) {
        setSaved(null)
        setForm({ ...EMPTY_ADDRESS, ...defaults })
        setShowErrors(false)
        setMessage('Your saved address has been removed.')
        onSaved?.(null)
      } else {
        setServerErrors(data.errors || ['Could not remove the address.'])
      }
    } catch {
      setServerErrors(['Could not reach the server. Please try again.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <form id="addressForm" onSubmit={handleSave} noValidate className="min-h-full flex flex-col lg:block lg:min-h-0">
      {serverErrors.length > 0 && (
        <div role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {serverErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
      {message && (
        <div role="status" id="addressMessage" className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          {message}
        </div>
      )}

      <AddressFields
        value={form}
        onChange={setForm}
        errors={showErrors ? errors : {}}
        idPrefix="profileAddress"
        labelClass="block text-gray-800 font-semibold mb-1 text-sm"
        inputClass="input-field w-full px-4 py-2.5 lg:py-2 rounded-xl text-base shadow-sm"
        invalidClass="border-red-500"
        roomy
        grouped
      />

      {/* At the bottom of the screen on phones, at the end of the card on desktop; still in view when the form scrolls. */}
      <div className="flex-1 min-h-6 lg:hidden" aria-hidden="true"></div>
      <div className="profile-savebar sticky bottom-0 z-20 -mx-5 sm:-mx-7 lg:-mx-6 xl:-mx-7 lg:mt-5 px-5 sm:px-7 lg:px-6 xl:px-7 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-0 bg-white lg:bg-white/95 border-t border-gray-100 lg:border-0 flex gap-3 lg:justify-end">
        {saved && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            aria-label="Remove saved address"
            className="min-h-12 px-4 lg:px-6 rounded-xl font-semibold text-red-600 border border-red-200 bg-white transition-colors [@media(hover:hover)]:hover:bg-red-50 disabled:opacity-50"
          >
            <span className="lg:hidden">Remove</span>
            <span className="hidden lg:inline">Remove saved address</span>
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-primary flex-1 lg:flex-none min-h-12 justify-center inline-flex items-center gap-2 px-8 text-white font-bold text-base rounded-xl shadow-lg"
        >
          <i className="bx bx-save text-lg" aria-hidden="true"></i>
          {busy ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  )
}
