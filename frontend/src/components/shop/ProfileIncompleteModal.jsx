// Shown when someone tries to buy without a phone number on their profile.
export default function ProfileIncompleteModal({ onClose, onUpdateProfile }) {
  return (
    <div
      id="profileIncompleteModal"
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-lg"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/60 max-w-md w-full mx-4 relative overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <i className="bx bx-user-plus text-2xl text-blue-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Complete Your Profile</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Please update your profile and add your phone number to continue with your purchase. This helps us
            contact you regarding your order.
          </p>
          <div className="flex space-x-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              Continue Shopping
            </button>
            <button
              onClick={onUpdateProfile}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-300"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
