import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

// The "Change Status" picker in the admin's Order Details: a button showing the picked status (color dot, name and a
// plain hint for the staff), which opens a list of every status with its hint. The status the order has now is
// tagged "Now"; Completed and Cancelled say "can't be undone".
//   options:  [{ value, label, dot (Tailwind bg class), hint, final }]
//   value:    the picked status; current: the order's status now; onChange(value)
//   disabled: an unpaid or finished order (the list cannot open)
// Keyboard: Enter, Space or the arrow keys open it; arrows / Home / End move; Enter or Space picks; Escape or Tab
// closes it (Escape does not close the whole pop-up). Screen readers hear a list box with its options.
// The list is placed with position: fixed under the button (above it when there is no room below), so the
// scrolling pop-up body cannot cut it off. Scrolling or resizing closes it.
export default function StatusPicker({ id, options, value, current, onChange, disabled = false, labelledBy }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // the option the keyboard is on
  const [place, setPlace] = useState(null) // { left, width, top | bottom, maxHeight }
  const button = useRef(null)
  const list = useRef(null)
  const listId = useId()
  const picked = options.find((o) => o.value === value) ?? options[0]

  // Opens the list under the button, or above it when the screen has more room there
  const openList = () => {
    if (disabled) return
    const r = button.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const base = { left: r.left, width: r.width }
    setPlace(below >= 260 || below >= above ? { ...base, top: r.bottom + 6, maxHeight: below - 6 } : { ...base, bottom: window.innerHeight - r.top + 6, maxHeight: above - 6 })
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const close = (focusButton = true) => {
    setOpen(false)
    if (focusButton) button.current?.focus()
  }
  const choose = (option) => {
    onChange(option.value)
    close()
  }

  // Focus the list when it opens, so the arrow keys and Escape go to it
  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  // Close it on scroll, resize or a click outside
  useEffect(() => {
    if (!open) return
    const shut = () => setOpen(false)
    const outside = (e) => {
      if (!list.current?.contains(e.target) && !button.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('resize', shut)
    document.addEventListener('scroll', shut, true)
    document.addEventListener('mousedown', outside)
    return () => {
      window.removeEventListener('resize', shut)
      document.removeEventListener('scroll', shut, true)
      document.removeEventListener('mousedown', outside)
    }
  }, [open])

  // Keep the keyboard's option in view
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onButtonKey = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
  }
  const onListKey = (e) => {
    const last = options.length - 1
    const moves = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // only the list closes, not the Order Details pop-up
      close()
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
        className={`h-[3.25rem] w-full sm:flex-1 min-w-0 flex items-center gap-2.5 px-3.5 rounded-xl border text-left outline-none transition-colors ${
          disabled
            ? 'bg-gray-100 border-[#d8dce8] cursor-not-allowed'
            : open
              ? 'bg-white border-2 border-[#2474b6] ring-4 ring-[#2474b6]/15'
              : 'bg-white border-[#d8dce8] [@media(hover:hover)]:hover:border-[#22306a] focus-visible:border-[#2474b6] focus-visible:ring-4 focus-visible:ring-[#2474b6]/15'
        }`}
      >
        <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${picked.dot}`} />
        <span className="flex-1 min-w-0">
          <span className={`block font-semibold leading-tight truncate ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{picked.label}</span>
          <span className="block text-xs text-gray-500 leading-snug truncate">{picked.hint}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 transition-transform ${disabled ? 'text-gray-400' : 'text-[#22306a]'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && place && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelledBy}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
          className="fixed z-[60] overflow-y-auto overscroll-contain bg-white border border-gray-200 rounded-[14px] shadow-[0_16px_40px_rgba(34,48,106,0.22)] p-1.5 outline-none"
        >
          {options.map((o, i) => {
            const isPicked = o.value === value
            return (
              <div
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isPicked}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the list
                onClick={() => choose(o)}
                onMouseMove={() => setActive(i)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer ${isPicked ? 'bg-[#eef5fb]' : ''} ${i === active ? 'ring-2 ring-inset ring-[#2474b6]/40' : ''}`}
              >
                <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${o.dot}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {o.label}
                    {o.final && <span className="ml-1.5 text-xs font-semibold text-amber-700">· can&apos;t be undone</span>}
                  </span>
                  <span className="block text-xs text-gray-500 leading-snug">{o.hint}</span>
                </span>
                {o.value === current && <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Now</span>}
                {isPicked && <Check aria-hidden="true" className="w-[1.125rem] h-[1.125rem] flex-shrink-0 text-[#22306a]" strokeWidth={2.5} />}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
