// GCash / PayMaya / GoTyme picker. `value` is what is sent to the server as "service".
const WALLETS = [
  { value: 'gcash', label: 'GCash', logo: '/images/gcash-logo.png' },
  { value: 'paymaya', label: 'PayMaya', logo: '/images/maya-logo.png' },
  { value: 'gotyme', label: 'GoTyme', logo: '/images/gotyme-logo.png' },
]

export default function EwalletOptions({ value, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold mb-6 text-gray-800">Choose E-wallet</h3>
      <div className="space-y-4">
        {WALLETS.map((wallet) => (
          <button
            type="button"
            key={wallet.value}
            data-value={wallet.value}
            onClick={() => onChange(wallet.value)}
            className={`ewallet-option w-full flex items-center gap-4 cursor-pointer p-4 rounded-xl border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ${
              value === wallet.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <img src={wallet.logo} alt={wallet.label} className="w-10 h-10 object-contain" />
            <span className="font-medium text-gray-700">{wallet.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
