import { useEffect, useState } from 'react'
import { getProfileMobile } from '../../services/profileService'
import { formatMoney } from '../../utils/formatMoney'
import ScreenshotUpload from './ScreenshotUpload'

// Step 2 of every payment page: the QR code on the left, the payment form on the right.
// Phones and tablets: QR card above the form. Wide screens (lg): side by side, both cards the same height.
// onSubmit({ mobile, reference, screenshot }) is called only when everything is filled in correctly.
// onBack() goes back to step 1 (choose another e-wallet).
export default function PaymentConfirmStep({ amount, onSubmit, onBack, error, submitting }) {
  const [mobile, setMobile] = useState('')
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [missingScreenshot, setMissingScreenshot] = useState(false)

  // Start with the number from the profile (if any), unless the customer already typed one
  useEffect(() => {
    let cancelled = false
    getProfileMobile().then((saved) => {
      if (!cancelled && saved) setMobile((typed) => typed || saved)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Digits only, at most 11 (same as the old page)
  const handleMobile = (e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))
  const mobileInvalid = mobile.length > 0 && mobile.length !== 11

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mobile.length !== 11) return
    if (!screenshot) {
      setMissingScreenshot(true)
      return
    }
    onSubmit({ mobile, reference, screenshot })
  }

  return (
    <div className="payment-step2 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
      {/* QR Code and instructions (left) */}
      <div className="pay-card p-6 sm:p-7 flex flex-col items-center justify-center text-center">
        <h2 className="pay-title text-2xl">Scan to Pay</h2>
        <p className="pay-muted mt-2 max-w-sm">
          Use your selected e-wallet app to scan the QR code and complete your payment.
        </p>
        <div className="pay-qr w-52 h-52 sm:w-56 sm:h-56 mt-5 flex items-center justify-center">
          <img src="/images/qr-code.png" alt="QR Code" className="w-44 h-44 sm:w-48 sm:h-48 object-contain" />
        </div>
        <div className="pay-panel w-full max-w-xs mt-5 px-5 py-3">
          <span className="block text-sm pay-muted">Amount to pay</span>
          <span id="confirmTotal" className="block text-2xl font-bold text-[#22306a] mt-0.5">
            ₱{formatMoney(amount)}
          </span>
        </div>
      </div>

      {/* Payment form (right) */}
      <div className="pay-card p-6 sm:p-7">
        <form id="paymentForm" onSubmit={handleSubmit} className="h-full flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="mobile" className="pay-label">
              Your Mobile No.
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              id="mobile"
              name="mobile"
              required
              value={mobile}
              onChange={handleMobile}
              className={`pay-input${mobileInvalid ? ' invalid' : ''}`}
              placeholder="09XXXXXXXXX"
            />
            {mobileInvalid && (
              <div id="mobileError" className="text-red-600 text-xs mt-1.5">
                Mobile number must be exactly 11 digits.
              </div>
            )}
          </div>
          <div>
            <label htmlFor="reference" className="pay-label">
              Reference Number
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="pay-input"
              placeholder="Enter reference number"
            />
          </div>

          <div>
            <ScreenshotUpload
              file={screenshot}
              invalid={missingScreenshot}
              onChange={(picked) => {
                setScreenshot(picked)
                if (picked) setMissingScreenshot(false)
              }}
            />
            {missingScreenshot && <p className="text-red-600 text-xs mt-1.5">Please upload a payment screenshot.</p>}
          </div>

          {error && (
            <div id="paymentError" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Pinned to the bottom of the card on wide screens. Small phones: stacked, Confirm Payment on top,
              so the two buttons never make the card wider than the screen. The breakpoint is in rem so it grows
              with the phone's text size: 23.75rem is 380px with normal text, about 475px with 20px text. */}
          <div className="mt-auto flex flex-col-reverse [@media(min-width:23.75rem)]:flex-row gap-3">
            {onBack && (
              <button type="button" onClick={onBack} disabled={submitting} className="pay-btn-outline">
                <i className="bx bx-arrow-back text-lg" aria-hidden="true"></i>
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || mobile.length !== 11 || reference.trim() === ''}
              className="pay-btn [@media(min-width:23.75rem)]:flex-1 px-4 whitespace-nowrap"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
