import { useEffect, useState } from 'react'
import { getProfileMobile } from '../../services/profileService'
import { formatMoney } from '../../utils/formatMoney'
import { paymentGuide } from '../../utils/paymentGuide'
import ScreenshotUpload from './ScreenshotUpload'

// One numbered step of "How to pay": a short instruction and one line explaining it
function GuideStep({ n, title, children }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-none w-6 h-6 mt-px rounded-full bg-[#22306a] text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">
        {n}
      </span>
      <span className="text-sm leading-snug text-gray-800">
        {title}
        <span className="block pay-muted text-[0.8125rem] mt-0.5">{children}</span>
      </span>
    </li>
  )
}

// Step 2 of every payment page: the QR code on the left, the payment form on the right.
// Phones and tablets: QR card above the form. Wide screens (lg): side by side, both cards the same height.
// onSubmit({ mobile, reference, screenshot }) is called only when everything is filled in correctly.
// onBack() goes back to step 1 (choose another e-wallet).
// service: the e-wallet chosen in step 1 ('gcash', 'paymaya', 'gotyme'); the "How to pay" steps and the hints
// under the boxes use its name and where its app shows the reference number (utils/paymentGuide.js).
export default function PaymentConfirmStep({ amount, service, onSubmit, onBack, error, submitting }) {
  const guide = paymentGuide(service)
  const isRefNo = guide.refLabel === 'Ref No.' // GCash: "Find Ref No. on ..."; others: "Find the reference number on ..."

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
      {/* QR Code, amount and "How to pay" (left) */}
      <div className="pay-card p-6 sm:p-7 flex flex-col items-center justify-center text-center">
        <h2 className="pay-title text-2xl">Scan to Pay</h2>
        <div className="pay-qr w-52 h-52 sm:w-56 sm:h-56 mt-5 flex items-center justify-center">
          <img src="/images/qr-code.png" alt="QR Code" className="w-44 h-44 sm:w-48 sm:h-48 object-contain" />
        </div>
        <div className="pay-panel w-full max-w-xs mt-5 px-5 py-3">
          <span className="block text-sm pay-muted">Amount to pay</span>
          <span id="confirmTotal" className="block text-2xl font-bold text-[#22306a] mt-0.5">
            ₱{formatMoney(amount)}
          </span>
        </div>

        {/* Always shown, right under the code, so customers read it before they pay */}
        <div id="paymentGuide" className="w-full mt-5 pt-5 border-t border-[#e5e9f2] text-left">
          <h3 className="text-[0.9375rem] font-bold text-[#22306a]">How to pay with {guide.name}</h3>
          <ol className="mt-3.5 space-y-3.5">
            <GuideStep
              n={1}
              title={
                guide.scanButton ? (
                  <>
                    Open {guide.name} and tap <b>{guide.scanButton}</b>
                  </>
                ) : (
                  <>Open {guide.name} and scan this code</>
                )
              }
            >
              {guide.scanButton ? 'Scan this code. ' : ''}Paying on this phone? Take a screenshot of the code and upload
              it in {guide.name}.
            </GuideStep>
            <GuideStep
              n={2}
              title={
                <>
                  Send exactly <b className="whitespace-nowrap">₱{formatMoney(amount)}</b>
                </>
              }
            >
              A different amount slows down checking your payment.
            </GuideStep>
            <GuideStep
              n={3}
              title={
                <>
                  Find {isRefNo ? '' : 'the '}
                  <b>{guide.refLabel}</b> on the {guide.refPlace}
                </>
              }
            >
              Take a screenshot that shows the amount and the {guide.refLabel}
              {guide.refLabel.endsWith('.') ? '' : '.'}
            </GuideStep>
            <GuideStep
              n={4}
              title={
                <>
                  Fill in the form and tap <b>Confirm Payment</b>
                </>
              }
            >
              We check your payment and update your order. You'll get an email.
            </GuideStep>
          </ol>
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
              aria-describedby={mobileInvalid ? 'mobileError' : 'mobileHint'}
            />
            {mobileInvalid ? (
              <div id="mobileError" className="text-red-600 text-xs mt-1.5">
                Mobile number must be exactly 11 digits.
              </div>
            ) : (
              <p id="mobileHint" className="pay-muted text-[0.8125rem] leading-snug mt-1.5">
                The number of the {guide.name} account you paid from
              </p>
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
              aria-describedby="referenceHint"
            />
            <p id="referenceHint" className="pay-muted text-[0.8125rem] leading-snug mt-1.5">
              The {guide.refLabel} on your {guide.name} {guide.refPlace}
            </p>
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
            {missingScreenshot ? (
              <p className="text-red-600 text-xs mt-1.5">Please upload a payment screenshot.</p>
            ) : (
              <p id="screenshotHint" className="pay-muted text-[0.8125rem] leading-snug mt-1.5">
                Your {guide.refPlace} with the amount and {guide.refLabel} showing
              </p>
            )}
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
