import { Link } from 'react-router-dom'

// Banner at the top of the Home page.
export default function Hero() {
  return (
    <section className="poster">
      <div className="banner-container">
        <div className="banner-content">
          <h1>Feel the Royal Touch of The Crown Diamond</h1>
          <p>This Month&apos;s Spotlight Jewelry</p>
          <Link to="/shop" className="shop-btn">Shop Now</Link>
        </div>
      </div>
    </section>
  )
}
