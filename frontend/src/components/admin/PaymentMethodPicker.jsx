import { Banknote, QrCode } from 'lucide-react'
import { STORE_METHODS } from '../../utils/storePayments'

// Cash / InstaPay as two tiles side by side (Walk-in Order and the "Collect the balance" step).
// InstaPay: the customer scanned the shop's QR with any e-wallet or bank app.
// Each tile is `relative` so its hidden radio button stays inside it (otherwise it can sit below the page).
//   name: the radio group's name; value / onChange(value); labelledBy: id of the heading that names the group
export default function PaymentMethodPicker({ name, value, onChange, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-2 sm:gap-3">
      {STORE_METHODS.map((m) => (
        <label key={m.value} className="relative cursor-pointer min-w-0">
          <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="peer sr-only" />
          <span className="flex flex-col items-center justify-center gap-1.5 h-full min-h-[4.25rem] px-1 py-2.5 rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-center transition-colors [@media(hover:hover)]:hover:border-[#c5cde0] peer-checked:border-[#2474b6] peer-checked:bg-[#eef5fc] peer-focus-visible:ring-4 peer-focus-visible:ring-[#2474b6]/15">
            {m.value === 'CASH' ? <Banknote className="w-7 h-7 text-emerald-600" aria-hidden="true" /> : <QrCode className="w-7 h-7 text-[#2474b6]" aria-hidden="true" />}
            <span className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight break-words">{m.label}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
