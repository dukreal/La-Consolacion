import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatMoney } from '../../utils/formatMoney'
import '../../styles/payment.css'

const COUNTDOWN_SECONDS = 30

// The receipt shown after paying (was payment/payment_success.php).
// It reads amount, mobile and reference from the address, then goes back to Home after 30 seconds.
// The payment is already saved when this page opens, so it shows right away (the old page first showed
// "Loading..." for 3 seconds, which only hid the confirmation).
export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const amount = formatMoney(parseFloat(params.get('amount')) || 0)
  const mobile = params.get('mobile') || 'N/A'
  const reference = params.get('reference') || 'N/A'

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const receiptRef = useRef(null)
  const downloadButtonRef = useRef(null)

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

  return (
    // One card in the middle of the screen; the countdown and the continue link sit under it
    <div className="payment-page flex items-center justify-center px-5 py-5">

      <div className="w-full max-w-md">
        {/* The receipt (this part is saved by "Download Screenshot") */}
        <div id="receiptArea" ref={receiptRef}>
          <div id="successMessage" className="pay-card fade-in px-6 py-7 sm:px-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <i className="bx bx-check text-4xl text-emerald-600" aria-hidden="true"></i>
            </div>

            <h1 className="pay-title text-[1.75rem] sm:text-3xl mt-4">Payment Successful!</h1>
            <p className="pay-muted mt-2">
              Thank you for paying{' '}
              <span className="font-bold text-[#22306a] whitespace-nowrap">
                ₱<span id="paidAmount">{amount}</span>
              </span>
            </p>

            <div className="pay-panel mt-5 px-4 py-3 text-sm text-left space-y-2">
              <div className="flex justify-between gap-4">
                <span className="pay-muted">Mobile No:</span>
                <span id="paidMobile" className="font-semibold text-[#22306a] text-right break-all">{mobile}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="pay-muted whitespace-nowrap">Reference No:</span>
                <span id="paidReference" className="font-semibold text-[#22306a] text-right break-all">{reference}</span>
              </div>
            </div>

            <p className="text-sm pay-muted mt-4">Your payment has been received and is being processed.</p>

            {/* Screenshot Notice */}
            <p className="text-sm font-medium text-[#2474b6] bg-[#eef4fb] rounded-lg px-3 py-2.5 mt-4">
              Please take a screenshot of this receipt for your reference.
            </p>

            <button ref={downloadButtonRef} onClick={takeScreenshot} className="screenshot-exclude pay-btn w-full mt-5">
              <i className="bx bx-download text-lg" aria-hidden="true"></i>
              Download Screenshot
            </button>
          </div>
        </div>

        {/* Countdown */}
        <div className="mt-5 px-1 text-center">
          <p className="text-sm pay-muted">
            You will be redirected to the shop&apos;s main page in{' '}
            <span id="countdownText" className="font-semibold text-[#22306a]">
              {secondsLeft}
            </span>{' '}
            seconds.
          </p>
          <div className="progress-bar mt-2.5">
            <div id="progressBar" className="progress-fill" style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}></div>
          </div>

          {/* Fallback Link */}
          <p className="text-sm pay-muted mt-4">
            If you&apos;re not redirected automatically,{' '}
            <Link to="/" replace id="manualRedirect" className="font-semibold text-[#22306a] underline underline-offset-2 hover:text-[#2474b6]">
              click here to continue
            </Link>
          </p>

          <p className="text-xs pay-muted mt-3">Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  )
}
