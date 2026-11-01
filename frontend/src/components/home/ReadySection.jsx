import { Link } from 'react-router-dom'

export default function ReadySection() {
  return (
    <section className="ready-section">
      <div className="ready-container">
        <div className="ready-image">
          <img src="/images/Ring.png" alt="" />
        </div>
        <div className="ready-content">
          <h2 className="ready-title">Ready-to-Wear Elegance</h2>
          <p className="ready-desc">
            Discover our curated collection of handcrafted, ready-to-wear pieces — perfect for
            effortless elegance, meaningful gifts, or everyday beauty. Each design is made with care
            and available for pickup in-store.
          </p>
          <Link to="/shop" className="shop-btn">
            Browse Collections <span className="ready-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
