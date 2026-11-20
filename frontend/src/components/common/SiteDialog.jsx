import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

// A small pop-up in the site's style, used instead of the browser's alert() and confirm() boxes.
//
//   Message:  <SiteDialog title="Couldn't add to cart" message="..." onClose={...} />
//   Question: <SiteDialog variant="danger" icon="bx-trash" title="Remove this item?" message="..."
//               confirmLabel="Remove" cancelLabel="Keep it" onConfirm={...} onClose={...} />
//   Info:     <SiteDialog variant="info" icon="bx-user" showClose title="Welcome" message="..."
//               cancelLabel="Create account" onCancel={...} confirmLabel="Log in" onConfirm={...} onClose={...} />
//   (onCancel: the left button does something of its own instead of just closing)
//
// It is drawn on <body> (a portal), so it always sits above the cart panel and the product pop-up.
// Its own clicks and its Escape key stop here, so they never close the panel or pop-up underneath.
// Two buttons: side by side from 440px wide, stacked on phones (the main one on top).
export default function SiteDialog({
  title,
  message,
  icon = 'bx-error-circle',
  variant = 'error', // 'error' (red icon, navy OK), 'danger' (red confirm button) or 'info' (navy icon)
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  showClose = false, // an x in the top corner
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
  const cancel = () => {
    onCancel?.()
    requestClose()
  }
  const iconColors =
    variant === 'info' ? 'bg-[#eef1f8] border-[#dfe4f0] text-[#22306a]' : 'bg-red-50 border-red-100 text-red-500'

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
        className={`relative w-full max-w-sm min-[440px]:max-w-md bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] px-6 pt-7 pb-6 text-center transition-all duration-300 ${
          shown ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {showClose && (
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-10 h-10 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 flex items-center justify-center text-[#5b6478] hover:bg-[#f5f6fa] hover:text-[#22306a] transition-colors"
          >
            <i className="bx bx-x text-2xl" aria-hidden="true"></i>
          </button>
        )}
        <div className={`w-14 h-14 mx-auto rounded-full border flex items-center justify-center ${iconColors}`}>
          <i className={`bx ${icon} text-[28px]`} aria-hidden="true"></i>
        </div>
        <h3 id="siteDialogTitle" className="mt-4 text-xl font-bold text-[#22306a]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {title}
        </h3>
        <p id="siteDialogMessage" className="mt-2 text-[15px] leading-relaxed text-[#5b6478]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {message}
        </p>

        <div className={`mt-6 ${isQuestion ? 'flex flex-col-reverse gap-3 min-[440px]:grid min-[440px]:grid-cols-2' : ''}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          {isQuestion ? (
            <>
              <button
                ref={firstButton}
                type="button"
                onClick={cancel}
                className="py-3 px-3 whitespace-nowrap rounded-[10px] outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={confirm}
                className={`py-3 px-3 whitespace-nowrap rounded-[10px] outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 text-white font-semibold transition-colors ${
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
              className="w-full py-3 px-4 rounded-[10px] outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors"
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
