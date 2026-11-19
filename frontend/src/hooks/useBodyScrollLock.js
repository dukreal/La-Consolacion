import { useEffect } from 'react'

// Stops the page behind a panel or modal from scrolling, and puts things back when it closes.
// It remembers the previous values, so a modal opened on top of a panel does not unlock the page.
//
// Hiding the page's scrollbar makes the page about 15px wider, so everything behind the modal
// jumped sideways. The lost scrollbar width is added back as padding, so nothing moves.
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return
    const { body } = document
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    if (previous.overflow !== 'hidden') {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      if (scrollbar > 0) {
        const current = parseFloat(getComputedStyle(body).paddingRight) || 0
        body.style.paddingRight = `${current + scrollbar}px`
      }
      body.style.overflow = 'hidden'
    }
    return () => {
      body.style.overflow = previous.overflow
      body.style.paddingRight = previous.paddingRight
    }
  }, [active])
}
