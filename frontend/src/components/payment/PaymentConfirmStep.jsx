import { useState } from 'react'
import { formatMoney } from '../../utils/formatMoney'
import ScreenshotUpload from './ScreenshotUpload'

// Step 2 of every payment page: the QR code on the left, the payment form on the right.
// onSubmit({ mobile, reference, screenshot }) is called only when everything is filled in correctly.
export default function PaymentConfirmStep({ amount, onSubmit, error, submitting }) {
  const [mobile, setMobile] = useState('')
  const [reference, setReference] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [missingScreenshot, setMissingScreenshot] = useState(false)

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
    <div className="payment-step2 flex flex-col md:flex-row gap-8 items-stretch justify-center py-8">
      {/* QR Code and instructions (left) */}
      <div className="md:w-1/2 w-full flex-1 flex flex-col modern-card p-8 h-full">
        <h2 className="text-2xl font-bold accent-blue mb-2 text-center">Scan to Pay</h2>
        <p className="text-gray-600 mb-4 text-center">
          Use your selected e-wallet app to scan the QR code and complete your payment.
        </p>
        <div className="w-56 h-56 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-accent-blue">
          <img src="/images/qr-code.png" alt="QR Code" className="w-48 h-48 object-contain" />
        </div>
        <div className="flex flex-col items-center mt-2">
          <span className="text-sm text-gray-500">Amount to pay</span>
          <span id="confirmTotal" className="text-2xl font-bold text-blue-600 mt-1">
            P{formatMoney(amount)}
          </span>
        </div>
      </div>

      {/* Payment form (right) */}
      <div className="md:w-1/2 w-full flex-1 flex flex-col h-full">
        <div className="modern-card p-8 h-full flex flex-col justify-between">
          <form id="paymentForm" onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                Your Mobile No.
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                required
                value={mobile}
                onChange={handleMobile}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition ${mobileInvalid ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="09XXXXXXXXX"
              />
              {mobileInvalid && (
                <div id="mobileError" className="text-red-600 text-xs mt-1 text-right">
                  Mobile number must be exactly 11 digits.
                </div>
              )}
            </div>
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                placeholder="Enter reference number"
              />
            </div>

            <ScreenshotUpload
              file={screenshot}
              onChange={(picked) => {
                setScreenshot(picked)
                if (picked) setMissingScreenshot(false)
              }}
            />
            {missingScreenshot && <p className="text-red-600 text-sm">Please upload a payment screenshot.</p>}

            {error && (
              <div id="paymentError" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || mobile.length !== 11 || reference.trim() === ''}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
