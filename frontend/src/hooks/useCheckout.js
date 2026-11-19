import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkProfileCompletion } from '../services/profileService'
import { saveCheckout } from '../utils/checkoutStorage'
import { useCart } from './useCart'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const imagePath = (image) => `/uploads/products/${image}`

// Everything "Buy Now" and "Proceed to Checkout" have in common:
// profile check -> loading screen -> save the order -> go to the payment page.
export function useCheckout({ onCartClose } = {}) {
  const navigate = useNavigate()
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [checkoutError, setCheckoutError] = useState(false) // the profile check failed (no connection, server error)

  // true when the profile has a phone number; otherwise shows the "Complete Your Profile" popup
  const profileIsComplete = async () => {
    if (await checkProfileCompletion()) return true
    setProfileModalOpen(true)
    return false
  }

  // Loading screen for 4 seconds (like the old page), save the order, then leave for the payment page
  const goToPayment = async (save) => {
    setLoading(true)
    await sleep(4000)
    save()
    onCartClose?.()
    await sleep(1000) // the old loading screen took one more second to finish
    setLoading(false)
    navigate('/checkout')
  }

  // "Proceed to Checkout" in the cart panel
  const checkoutCart = async () => {
    if (items.length === 0) return
    try {
      if (!(await profileIsComplete())) return
    } catch (error) {
      console.error('Error checking profile:', error)
      setCheckoutError(true)
      return
    }
    await goToPayment(() =>
      saveCheckout({
        items: items.map((item) => ({
          id: item.product_id,
          qty: item.quantity,
          name: item.name,
          price: item.price,
          image: imagePath(item.image),
        })),
        fromCart: true,
      }),
    )
  }

  // "Buy Now" in the product modal. onProcessing runs once the profile check has passed.
  const buyNow = async (product, onProcessing) => {
    try {
      if (!(await profileIsComplete())) return
    } catch (error) {
      console.error('Error checking profile:', error)
      setCheckoutError(true)
      return
    }
    onProcessing?.()
    await goToPayment(() =>
      saveCheckout({
        items: [{ id: product.id, qty: 1, name: product.name, price: product.price, image: imagePath(product.image) }],
        fromCart: false,
        total: product.price,
      }),
    )
  }

  const closeProfileModal = () => setProfileModalOpen(false)
  const goToProfile = () => {
    setProfileModalOpen(false)
    navigate('/profile')
  }

  const closeCheckoutError = () => setCheckoutError(false)

  return { loading, profileModalOpen, closeProfileModal, goToProfile, checkoutError, closeCheckoutError, checkoutCart, buyNow }
}
