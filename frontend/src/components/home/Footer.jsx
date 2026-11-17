import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer modern-footer">
      <div className="footer-bg">
        <div className="footer-row-modern">
          <div className="footer-contact-modern">
            <i className="bx bx-phone"></i>
            <span>+09203048490</span>
          </div>
          <div className="footer-logo-card">
            <img src="/images/LCJ.png" alt="La Consolacion Jewelry Logo" className="footer-logo-modern" />
          </div>
          <div className="footer-social-modern">
            <a href="#" className="footer-social-icon" aria-label="Instagram">
              <i className="bx bxl-instagram"></i>
            </a>
            <a href="#" className="footer-social-icon" aria-label="Facebook">
              <i className="bx bxl-facebook"></i>
            </a>
          </div>
        </div>
        <nav className="footer-nav-modern">
          <Link to="/">Home</Link>
          <Link to="/shop">Premade Collection</Link>
          <Link to="/#steps">Order Custom</Link>
          <Link to="/#about">About Us</Link>
        </nav>
        <div className="footer-copyright-modern">
          &copy; 1980 La Consolacion Jewelry. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
