import { useState } from 'react'
import { saveAddress } from '../../services/profileService'
import { EMPTY_ADDRESS, toAddress, validateAddress } from '../../utils/address'
import AddressFields from './AddressFields'

// "Delivery Address" on the Profile page: the address used for delivery by courier at checkout.
//   initial: the saved address from getProfile() (or null), defaults: { name, mobile } to start an empty form with
export default function SavedAddressCard({ initial, defaults }) {
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
    <section aria-labelledby="addressTitle" className="profile-card rounded-2xl shadow-xl p-5 sm:p-8 mt-6">
      <div className="mb-5">
        <h2 id="addressTitle" className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="bx bx-package text-xl" style={{ color: '#2474b6' }} aria-hidden="true"></i>
          Delivery Address
        </h2>
        <p className="text-gray-600 text-sm mt-1">Used when you choose delivery by courier at checkout. You can still change it for each order.</p>
      </div>

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

      <form onSubmit={handleSave} noValidate>
        <AddressFields
          value={form}
          onChange={setForm}
          errors={showErrors ? errors : {}}
          idPrefix="profileAddress"
          labelClass="block text-gray-800 font-semibold mb-2 text-sm"
          inputClass="input-field w-full px-4 py-3 rounded-xl text-base shadow-sm transition-all duration-300"
          invalidClass="border-red-500"
        />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          {saved && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="min-h-12 px-6 rounded-xl font-semibold text-red-600 border border-red-200 bg-white transition-colors [@media(hover:hover)]:hover:bg-red-50 disabled:opacity-50"
            >
              Remove saved address
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary justify-center inline-flex items-center gap-2 px-8 py-3 text-white font-bold text-base rounded-xl shadow-lg"
          >
            <i className="bx bx-save text-lg" aria-hidden="true"></i>
            {busy ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      </form>
    </section>
  )
}
