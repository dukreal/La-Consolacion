import { useEffect, useRef } from 'react'

// Open pop-ups, newest last: only the one on top reacts to Escape and Tab
// (e.g. an error message opened over the Order Details pop-up).
const openDialogs = []

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Keyboard behaviour for a pop-up (the box itself is `ref`):
//   - when it opens, focus moves into it: to the element marked data-autofocus (e.g. Cancel), else the first button
//   - Tab / Shift+Tab stay inside it instead of going to the page behind
//   - Escape calls onClose (leave onClose out for a pop-up that must be answered with its buttons)
//   - when it closes, focus goes back to whatever had it before (usually the button that opened it), unless
//     another pop-up opened at the same moment and took it
export function useDialog(ref, onClose) {
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const box = ref.current
    if (!box) return
    const before = document.activeElement
    const entry = {}
    openDialogs.push(entry)
    ;(box.querySelector('[data-autofocus]') || box.querySelector(FOCUSABLE) || box).focus()

    const onKey = (e) => {
      if (openDialogs[openDialogs.length - 1] !== entry) return // another pop-up is on top
      if (e.key === 'Escape' && close.current) {
        e.preventDefault()
        close.current()
      } else if (e.key === 'Tab') {
        const items = [...box.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
        if (items.length === 0) return e.preventDefault()
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      openDialogs.splice(openDialogs.indexOf(entry), 1)
      // Give focus back, unless something else already has it (e.g. a message pop-up that opened as this one closed)
      const now = document.activeElement
      if ((!now || now === document.body || box.contains(now)) && before && document.contains(before)) before.focus({ preventScroll: true })
    }
  }, [ref])
}
