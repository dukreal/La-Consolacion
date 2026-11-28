import { useState } from 'react'

// Apps that can pay the shop's InstaPay QR, shown as examples. A logo that is missing from public/images
// shows the app's name instead (MariBank until frontend/public/images/maribank-logo.png is added).
const APPS = [
  { name: 'GCash', logo: '/images/gcash-logo.png' },
  { name: 'Maya', logo: '/images/maya-logo.png' },
  { name: 'GoTyme', logo: '/images/gotyme-logo.png' },
  { name: 'MariBank', logo: '/images/maribank-logo.png' },
]

function AppLogo({ app }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return (
      <span className="h-9 px-2.5 inline-flex items-center rounded-lg border border-[#e5e9f2] bg-[#f5f6fa] text-sm font-semibold text-[#22306a]">
        {app.name}
      </span>
    )
  }
  return (
    <img
      src={app.logo}
      alt={app.name}
      title={app.name}
      onError={() => setMissing(true)}
      className="w-9 h-9 object-contain rounded-lg"
    />
  )
}

// Step 1 of Checkout, Custom Order Payment and Pay for Your Order: how the customer will pay. Nothing to choose:
// the shop's QR is InstaPay, so any e-wallet or bank app can pay it (step 2 shows the QR).
export default function InstapayInfo() {
  return (
    <div id="instapayInfo" className="pay-card p-6 sm:p-7">
      <h3 className="pay-title text-xl mb-2">How you'll pay</h3>
      <p className="pay-muted">
        On the next step, scan our <b className="text-[#22306a]">InstaPay QR</b> with any e‑wallet or bank app.
      </p>
      <div className="flex flex-wrap items-center gap-2.5 mt-4">
        {APPS.map((app) => (
          <AppLogo key={app.name} app={app} />
        ))}
        <span className="pay-muted text-sm">and other InstaPay banks</span>
      </div>
    </div>
  )
}
