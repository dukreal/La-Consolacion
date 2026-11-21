import { AlertTriangle, CheckCircle, Info, Trash2, XCircle } from 'lucide-react'
import { useRef } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { navyButton } from '../../utils/dialogButtons'

// The small centered pop-up with a round icon on top, used by the Orders page and the Order Details pop-up for
// messages ("Order Deleted") and questions ("Delete Order?").
//   type: 'success' | 'error' | 'warning' | 'info' | 'delete' (picks the icon and its color)
//   onClose: what Escape and a click outside do (usually the same as Cancel / OK); leave it out to require a button
//   children: the buttons (mark the safe one, e.g. Cancel, with data-autofocus so it gets the keyboard focus)
const TYPES = {
  success: { icon: CheckCircle, color: 'bg-emerald-500' },
  error: { icon: XCircle, color: 'bg-red-500' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500' },
  info: { icon: Info, color: 'bg-sky-500' },
  delete: { icon: Trash2, color: 'bg-red-500' },
}

export default function IconModal({ id, type = 'info', title, message, onClose, children }) {
  const { icon: Icon, color } = TYPES[type] || TYPES.info
  const box = useRef(null)
  useDialog(box, onClose)
  return (
    <div
      id={id}
      className="fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4"
      onClick={(e) => onClose && e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        tabIndex={-1}
        className="bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 outline-none"
      >
        <div className="flex items-center justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h3 id={`${id}-title`} className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p id={`${id}-message`} className="text-gray-600 mb-6">{message}</p>
          <div className="flex flex-wrap justify-center gap-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

// The OK button of the message pop-up (navy, like the other main buttons)
export function OkButton({ onClick }) {
  return (
    <button type="button" id="alertCloseBtn" onClick={onClick} className={`${navyButton} min-w-[6rem]`}>
      OK
    </button>
  )
}
