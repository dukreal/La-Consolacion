import { Link } from 'react-router-dom'
import '../../styles/auth.css'

// The white card with the logo that wraps every auth page (login, register, ...).
// wide: a slightly wider card for forms with two fields per row (Register).
export default function AuthCard({ title, subtitle, wide = false, children }) {
  return (
    <div className="form-bg">
      <div className={`form-container fade-in${wide ? ' form-container-wide' : ''}`}>
        <Link to="/" className="form-logo-wrap">
          <img src="/images/LCJ.png" alt="LA Consolacion Jewelry Logo" className="form-logo" />
        </Link>
        <h2>{title}</h2>
        {subtitle && <p className="form-welcome">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
