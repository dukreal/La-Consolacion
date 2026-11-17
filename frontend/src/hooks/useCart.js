import { useContext } from 'react'
import { CartContext } from '../context/cart-context'

// Use in any component: const { items, addToCart } = useCart()
export function useCart() {
  return useContext(CartContext)
}
