import { useEffect, useState } from 'react'
import { getCustomOrder } from '../services/customOrderService'

// Loads the custom order for the preview and payment pages.
// Returns { order, error, loading }.
export function useCustomOrder(id) {
  const [state, setState] = useState({ order: null, error: '', loading: true })

  useEffect(() => {
    let cancelled = false
    getCustomOrder(id)
      .then((order) => {
        if (!cancelled) setState({ order, error: '', loading: false })
      })
      .catch((error) => {
        if (!cancelled) setState({ order: null, error: error.message, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}
