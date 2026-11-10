import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

// The green "Success!" / red "Error" popup with an OK button.
export default function MessageModal({ type = 'success', message, onClose }) {
  const { shown } = useAnimatedModal(onClose)
  useBodyScrollLock()
  const isSuccess = type === 'success'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300 ${shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <i className={`bx ${isSuccess ? 'bx-check text-green-600' : 'bx-x text-red-600'} text-3xl`}></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{isSuccess ? 'Success!' : 'Error'}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 text-white font-medium rounded-xl transition-all duration-300 ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
