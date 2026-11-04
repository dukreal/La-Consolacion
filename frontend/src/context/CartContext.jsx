import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { CartContext } from './cart-context'

// Loads the cart from PHP. PHP sends numbers as text ("2"), so we convert them.
async function fetchCart() {
  try {
    const data = await api('/cart/get-cart-items.php')
    if (!data.success) return null
    return {
      items: data.items.map((item) => ({
        ...item,
        cart_id: Number(item.cart_id),
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        price: Number(item.price),
        stock: Number(item.stock),
      })),
      total: Number(data.total),
    }
  } catch {
    return null
  }
}

// Keeps the logged-in user's cart so the header, the Shop and the cart panel all agree.
export function CartProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)

  // Load the cart whenever someone logs in
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchCart().then((cart) => {
      if (!cancelled && cart) {
        setItems(cart.items)
        setTotal(cart.total)
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Reload after every change so the screen always matches the database
  const loadCart = useCallback(async () => {
    const cart = await fetchCart()
    if (cart) {
      setItems(cart.items)
      setTotal(cart.total)
    }
  }, [])

  // Each action returns PHP's answer: { success: true } or { success: false, error: '...' }
  const addToCart = async (productId, quantity = 1) => {
    const data = await api('/cart/add-to-cart.php', {
      method: 'POST',
      form: { product_id: productId, quantity },
    })
    if (data.success) await loadCart()
    return data
  }

  const setQuantity = async (productId, quantity) => {
    const data = await api('/cart/update-cart.php', {
      method: 'POST',
      form: { action: 'update_quantity', product_id: productId, quantity },
    })
    if (data.success) await loadCart()
    return data
  }

  const removeItem = async (productId) => {
    const data = await api('/cart/update-cart.php', {
      method: 'POST',
      form: { action: 'remove', product_id: productId },
    })
    if (data.success) await loadCart()
    return data
  }

  // How many of this product are already in the cart (0 if none)
  const getQuantity = (productId) =>
    items.find((item) => item.product_id === Number(productId))?.quantity ?? 0

  // Logged out means an empty cart
  const value = {
    items: userId ? items : [],
    total: userId ? total : 0,
    count: userId ? items.length : 0, // number of different products, like the old cart count
    totalQuantity: userId ? items.reduce((sum, item) => sum + item.quantity, 0) : 0,
    loadCart,
    addToCart,
    setQuantity,
    removeItem,
    getQuantity,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
