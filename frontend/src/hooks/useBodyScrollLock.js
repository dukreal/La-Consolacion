import { useEffect } from 'react'

// Stops the page behind a panel or modal from scrolling, and puts things back when it closes.
// It remembers the previous value, so a modal opened on top of a panel does not unlock the page.
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous || 'auto'
    }
  }, [active])
}
