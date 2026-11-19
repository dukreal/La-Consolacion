import { AlertTriangle, CheckCircle, Info, Trash2, XCircle } from 'lucide-react'

// The small centered pop-up with a round icon on top, used by the Orders page for
// messages ("Order Deleted") and questions ("Delete Order?").
//   type: 'success' | 'error' | 'warning' | 'info' | 'delete' (picks the icon and its color)
//   children: the buttons
const TYPES = {
  success: { icon: CheckCircle, color: 'bg-emerald-500' },
  error: { icon: XCircle, color: 'bg-red-500' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500' },
  info: { icon: Info, color: 'bg-sky-500' },
  delete: { icon: Trash2, color: 'bg-red-500' },
}

export default function IconModal({ id, type = 'info', title, message, children }) {
  const { icon: Icon, color } = TYPES[type] || TYPES.info
  return (
    <div id={id} className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-center gap-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// The blue OK button of the message pop-up
export function OkButton({ onClick }) {
  return (
    <button
      type="button"
      id="alertCloseBtn"
      onClick={onClick}
      className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
    >
      OK
    </button>
  )
}
