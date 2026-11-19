import { useEffect, useRef } from 'react'

// Calls onEscape when the Escape key is pressed, only while `active` is true.
// Used by the slide-out panels and pop-ups so the keyboard can close them.
export function useEscapeKey(active, onEscape) {
  // Keep the latest function without re-adding the listener on every render
  const handler = useRef(onEscape)
  useEffect(() => {
    handler.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key === 'Escape') handler.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])
}
