import { useEffect, useState } from 'react'
import { getProfile } from '../services/profileService'
import { EMPTY_ADDRESS, toAddress, validateAddress } from '../utils/address'

// The pickup / delivery choice of a checkout page (shown by components/payment/DeliveryChoice.jsx).
// Starts from the address saved on the profile, or from the customer's name and mobile number.
const ID = 'delivery' // the address fields' ids are `delivery-<field>` (DeliveryChoice passes the same prefix)

export function useDelivery() {
  const [fulfillment, setFulfillment] = useState('pickup')
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [saved, setSaved] = useState(null) // the address saved on the profile, or null
  const [editing, setEditing] = useState(true) // false: show the saved address as a card
  const [saveAddress, setSaveAddress] = useState(true)
  const [showErrors, setShowErrors] = useState(false)

  // Start from the saved address, or from the customer's name and mobile number
  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((user) => {
        if (cancelled) return
        if (user.address) {
          const savedAddress = toAddress(user.address)
          setSaved(savedAddress)
          setAddress(savedAddress)
          setEditing(false)
        } else {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          const mobile = String(user.mobileNumber || '').replace(/\D/g, '').slice(0, 11)
          setAddress((typed) => (typed.name || typed.mobile ? typed : { ...typed, name, mobile }))
        }
      })
      .catch(() => {}) // the form simply starts empty
    return () => {
      cancelled = true
    }
  }, [])

  const errors = fulfillment === 'delivery' ? validateAddress(address) : {}

  const check = () => {
    if (fulfillment !== 'delivery' || Object.keys(errors).length === 0) return true
    setShowErrors(true)
    setEditing(true)
    // Bring the first field to fix into view (after the form has opened)
    const first = Object.keys(EMPTY_ADDRESS).find((key) => errors[key])
    setTimeout(() => {
      const input = document.getElementById(`${ID}-${first}`)
      input?.scrollIntoView({ block: 'center' })
      input?.focus({ preventScroll: true })
    }, 0)
    return false
  }

  // Only save when the customer typed something new (or has nothing saved yet)
  const changed = !saved || Object.keys(EMPTY_ADDRESS).some((key) => saved[key] !== address[key])

  return {
    fulfillment,
    setFulfillment,
    address,
    setAddress,
    saved,
    editing,
    setEditing,
    saveAddress,
    setSaveAddress,
    changed,
    errors: showErrors ? errors : {},
    check,
    payload: { fulfillment, address, saveAddress: fulfillment === 'delivery' && saveAddress && changed },
  }
}

