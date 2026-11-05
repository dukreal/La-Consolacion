import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Opens a panel when the address has ?name=true, then cleans the address.
// The header's "My Cart" and "Order History" links point at /shop?openCart=true and
// /shop?openOrderHistory=true. `open` should be a stable function (wrap it in useCallback).
export function useOpenFromUrl(name, open) {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get(name) !== 'true') return
    const timer = setTimeout(() => {
      open()
      const rest = new URLSearchParams(searchParams)
      rest.delete(name)
      setSearchParams(rest, { replace: true })
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams, name, open, setSearchParams])
}
