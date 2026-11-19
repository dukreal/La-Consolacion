// GCash / PayMaya / GoTyme picker. `value` is what is sent to the server as "service".
const WALLETS = [
  { value: 'gcash', label: 'GCash', logo: '/images/gcash-logo.png' },
  { value: 'paymaya', label: 'PayMaya', logo: '/images/maya-logo.png' },
  { value: 'gotyme', label: 'GoTyme', logo: '/images/gotyme-logo.png' },
]

export default function EwalletOptions({ value, onChange }) {
  return (
    <div className="pay-card p-6 sm:p-7">
      <h3 className="pay-title text-xl mb-5">Choose E-wallet</h3>
      <div className="space-y-3" role="radiogroup" aria-label="E-wallet">
        {WALLETS.map((wallet) => {
          const selected = value === wallet.value
          return (
            <button
              type="button"
              key={wallet.value}
              data-value={wallet.value}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(wallet.value)}
              className={`ewallet-option pay-wallet w-full flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer text-left ${selected ? 'selected' : ''}`}
            >
              <img src={wallet.logo} alt="" className="w-10 h-10 flex-shrink-0 object-contain rounded-lg" />
              <span className="flex-1 font-semibold text-[#22306a]">{wallet.label}</span>
              <span className="pay-radio" aria-hidden="true"></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
