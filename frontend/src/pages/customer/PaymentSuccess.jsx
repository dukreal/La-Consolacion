import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import '../../styles/payment.css'

const COUNTDOWN_SECONDS = 20

// The receipt shown after paying (was payment/payment_success.php).
// It reads amount, mobile and reference from the address, then goes back to Home after 20 seconds.
export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const amount = parseFloat(params.get('amount') || '0.00').toFixed(2)
  const mobile = params.get('mobile') || 'N/A'
  const reference = params.get('reference') || 'N/A'

  const [loading, setLoading] = useState(true) // the old page showed "Loading..." for 3 seconds
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const receiptRef = useRef(null)
  const downloadButtonRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Count down one second at a time
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  // At zero, go back to Home
  useEffect(() => {
    if (secondsLeft === 0) navigate('/', { replace: true })
  }, [secondsLeft, navigate])

  // Enter also goes back to Home
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') navigate('/', { replace: true })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate])

  // Saves the receipt as payment_receipt.png (without the button itself)
  const takeScreenshot = async () => {
    const button = downloadButtonRef.current
    button.style.display = 'none'
    try {
      // html2canvas is big, so it is only downloaded when someone actually clicks the button
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        // html2canvas photographs a hidden copy of the page, where the fade-in animation starts
        // again from invisible. Switch it off in that copy so the receipt comes out solid and sharp.
        onclone: (copy) => copy.querySelector('#successMessage')?.classList.remove('fade-in'),
      })
      const link = document.createElement('a')
      link.download = 'payment_receipt.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      button.style.display = ''
    }
  }

  // The circle turns orange for the last 3 seconds, red at the end (same as the old page)
  const circleColor = secondsLeft <= 0 ? 'bg-red-500' : secondsLeft <= 3 ? 'bg-orange-500' : 'bg-accent-blue'

  return (
    <div className="payment-page bg-white min-h-screen flex items-center justify-center">
      {loading && <LoadingOverlay />}

      <div className="max-w-md mx-auto px-4 text-center">
        {/* Success Icon */}
        <div className="success-icon mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message (this part is saved by "Download Screenshot") */}
        <div id="receiptArea" ref={receiptRef}>
          <div
            id="successMessage"
            className="bg-white text-gray-900 p-6 rounded-xl shadow-lg fade-in mb-8 text-center border border-gray-300"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-800 mb-2">
              Thank you for paying{' '}
              <span className="font-semibold accent-blue">
                ₱<span id="paidAmount">{amount}</span>
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Mobile No:</strong> <span id="paidMobile">{mobile}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Reference No:</strong> <span id="paidReference">{reference}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">Your payment has been received and is being processed.</p>

            {/* Screenshot Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700 text-sm font-medium">Please take a screenshot of this receipt for your reference.</p>
            </div>

            <button
              ref={downloadButtonRef}
              onClick={takeScreenshot}
              className="screenshot-exclude bg-accent-blue text-white py-2 px-4 rounded-lg hover-accent-blue transition"
            >
              Download Screenshot
            </button>
          </div>
        </div>

        {/* Countdown Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`countdown-circle w-16 h-16 ${circleColor} rounded-full flex items-center justify-center`}>
              <span id="countdown" className="text-2xl font-bold text-white">
                {secondsLeft}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-2">
            You will be redirected to the shop&apos;s main page in{' '}
            <span id="countdownText" className="font-semibold accent-blue">
              {secondsLeft}
            </span>{' '}
            seconds.
          </p>
          {/* Progress Bar */}
          <div className="progress-bar">
            <div id="progressBar" className="progress-fill" style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}></div>
          </div>
        </div>

        {/* Fallback Link */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">If you&apos;re not redirected automatically,</p>
          <Link
            to="/"
            replace
            id="manualRedirect"
            className="inline-flex items-center px-4 py-2 bg-accent-blue hover-accent-blue text-white font-medium rounded-lg transition duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Click here to continue
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  )
}
