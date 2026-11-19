import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

// A small pop-up in the site's style, used instead of the browser's alert() and confirm() boxes.
//
//   Message:  <SiteDialog title="Couldn't add to cart" message="..." onClose={...} />
//   Question: <SiteDialog variant="danger" icon="bx-trash" title="Remove this item?" message="..."
//               confirmLabel="Remove" cancelLabel="Keep it" onConfirm={...} onClose={...} />
//
// It is drawn on <body> (a portal), so it always sits above the cart panel and the product pop-up.
// Its own clicks and its Escape key stop here, so they never close the panel or pop-up underneath.
export default function SiteDialog({
  title,
  message,
  icon = 'bx-error-circle',
  variant = 'error', // 'error' (red icon, navy OK) or 'danger' (red confirm button)
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useBodyScrollLock()
  const isQuestion = Boolean(onConfirm)
  const firstButton = useRef(null)

  // Escape closes only this dialog: caught on the way down (capture), before the panel's own Escape handler
  const close = useRef(requestClose)
  useEffect(() => {
    close.current = requestClose
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close.current()
    }
    window.addEventListener('keydown', onKey, true)
    firstButton.current?.focus()
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const confirm = () => {
    onConfirm()
    requestClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="siteDialogTitle"
      aria-describedby="siteDialogMessage"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={requestClose}
      ></div>
      <div
        className={`relative w-full max-w-sm bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] px-6 pt-7 pb-6 text-center transition-all duration-300 ${
          shown ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <i className={`bx ${icon} text-[28px] text-red-500`} aria-hidden="true"></i>
        </div>
        <h3 id="siteDialogTitle" className="mt-4 text-xl font-bold text-[#22306a]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {title}
        </h3>
        <p id="siteDialogMessage" className="mt-2 text-[15px] leading-relaxed text-[#5b6478]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {message}
        </p>

        <div className={`mt-6 ${isQuestion ? 'grid grid-cols-2 gap-3' : ''}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          {isQuestion ? (
            <>
              <button
                ref={firstButton}
                type="button"
                onClick={requestClose}
                className="py-3 px-4 rounded-[10px] border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={confirm}
                className={`py-3 px-4 rounded-[10px] text-white font-semibold transition-colors ${
                  variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#22306a] hover:bg-[#1a2550]'
                }`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              ref={firstButton}
              type="button"
              onClick={requestClose}
              className="w-full py-3 px-4 rounded-[10px] bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
