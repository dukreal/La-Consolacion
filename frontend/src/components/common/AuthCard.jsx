import { Link } from 'react-router-dom'
import '../../styles/auth.css'

// The card that wraps every account page (Login, Register, Forgot/Reset Password, Verify Email).
// Desktop: a navy brand panel on the left (logo, gem drawing, the welcome line) and the form on the right.
// Phones and tablets: one card with a short navy band holding the logo, the form below.
// wide: a little more room for forms with two fields per row (Register).
export default function AuthCard({ title, subtitle, wide = false, children }) {
  return (
    <div className="form-bg">
      <div className={`auth-shell fade-in${wide ? ' auth-shell-wide' : ''}`}>
        <aside className="auth-brand">
          <Link to="/" className="auth-brand-logo" aria-label="La Consolacion Jewelry home">
            <img src="/images/LCJ.png" alt="LA Consolacion Jewelry Logo" />
          </Link>
          <svg className="auth-brand-gem" viewBox="0 0 120 96" fill="none" aria-hidden="true">
            <path d="M30 8h60l22 26-52 56L8 34z"></path>
            <path d="M8 34h104M30 8l14 26 16 56 16-56 14-26M44 34L60 8l16 26"></path>
          </svg>
          {subtitle && <p className="auth-brand-text">{subtitle}</p>}
        </aside>

        <div className="form-container">
          <h2>{title}</h2>
          {/* Phones and tablets: the welcome line under the title (on desktop it is in the navy panel) */}
          {subtitle && <p className="form-welcome">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
