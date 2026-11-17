import { createContext } from 'react'

// The shared shopping cart. CartProvider fills it, useCart() reads it.
export const CartContext = createContext(null)
