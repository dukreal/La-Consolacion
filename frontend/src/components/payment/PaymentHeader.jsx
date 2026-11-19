const STEPS = ['Choose e-wallet', 'Pay & confirm']

// Title, subtitle and the "1 Choose e-wallet — 2 Pay & confirm" step label at the top of
// the Checkout and Custom Order Payment pages. step: 1 or 2 (leave it out to hide the steps).
export default function PaymentHeader({ title, subtitle, step }) {
  return (
    <div className="mb-6 lg:mb-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 className="pay-title text-[1.75rem] sm:text-[2.1rem]">{title}</h1>
        <p className="pay-muted mt-1.5">{subtitle}</p>
      </div>

      {step && (
        <ol className="flex items-center gap-2.5 text-sm" aria-label="Payment steps">
          {STEPS.map((label, index) => {
            const number = index + 1
            const state = number === step ? 'active' : number < step ? 'done' : ''
            return (
              <li key={label} className="flex items-center gap-2.5" aria-current={number === step ? 'step' : undefined}>
                {index > 0 && <span className="w-6 sm:w-10 h-px bg-[#d8dce8]" aria-hidden="true" />}
                <span className={`pay-step-dot ${state}`}>
                  {state === 'done' ? <i className="bx bx-check text-base" aria-hidden="true"></i> : number}
                </span>
                <span className={`whitespace-nowrap ${number === step ? 'font-semibold text-[#22306a]' : 'pay-muted'}`}>{label}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
