import { useContext, useEffect, useState } from 'react'
import { AdminBusyContext } from '../context/admin-busy-context'

// True once `active` has stayed true for `delay` ms, so a quick reload does not flash anything
export function useDelayedFlag(active, delay = 150) {
  const [late, setLate] = useState(false)
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setLate(true), delay)
    return () => {
      clearTimeout(timer)
      setLate(false)
    }
  }, [active, delay])
  return active && late
}

// For an admin page that is reloading data it already shows (a new Logs page, the list after a delete):
// after a short moment the admin frame shows the thin blue bar under the top bar.
// Returns true while that is the case, so the page can fade the old list a little.
export function useRefreshing(active) {
  const shown = useDelayedFlag(active)
  const markBusy = useContext(AdminBusyContext)
  useEffect(() => {
    if (!shown) return
    markBusy(1)
    return () => markBusy(-1)
  }, [shown, markBusy])
  return shown
}

// Classes for the list that is being reloaded: faded to half while the new data is on its way
export const refreshingClass = (refreshing) => `transition-opacity duration-200 ${refreshing ? 'opacity-50' : ''}`
