import { useEffect, useRef, useState } from 'react'

// Grow-in / shrink-out animation for modals (same timings as the old page).
// Put `shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'` on the modal card, and call
// requestClose() instead of onClose(): it shrinks the card for 300 ms, then calls onClose.
export function useAnimatedModal(onClose) {
  const [shown, setShown] = useState(false)
  const closeTimer = useRef(null)

  useEffect(() => {
    const enterTimer = setTimeout(() => setShown(true), 10)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(closeTimer.current)
    }
  }, [])

  const requestClose = () => {
    setShown(false)
    closeTimer.current = setTimeout(onClose, 300)
  }

  return { shown, requestClose }
}
