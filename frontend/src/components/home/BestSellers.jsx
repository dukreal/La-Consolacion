// The three featured products. The arrows are decorative, as in the original page.
const bestSellers = [
  { image: '494324954_1183859846336540_5343954234173565708_n.jpg', name: 'Crown Diamond Ring' },
  { image: '494325447_1231333955173886_6890510470019316369_n.jpg', name: 'Gold Teddy Bear Ring' },
  { image: '494325961_638023342401034_6252364838369281331_n.jpg', name: 'Silver and Gold Pyramid Ring' },
]

export default function BestSellers() {
  return (
    <section className="best-sellers-section">
      <h2 className="best-sellers-title">Our Best Sellers</h2>
      <div className="best-sellers-carousel">
        <button className="carousel-arrow left" aria-label="Previous">
          &#8249;
        </button>
        <div className="carousel-track">
          {bestSellers.map((item) => (
            <div className="carousel-card" key={item.image}>
              <img src={`/uploads/products/${item.image}`} alt={item.name} />
              <div className="carousel-caption">{item.name}</div>
            </div>
          ))}
        </div>
        <button className="carousel-arrow right" aria-label="Next">&#8250;</button>
      </div>
    </section>
  )
}
