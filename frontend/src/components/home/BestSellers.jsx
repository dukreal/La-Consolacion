import { useEffect, useRef, useState } from 'react'

// The featured products, shown as a slider: swipe on phones, or use the ‹ › arrows.
// On wide screens all cards fit, so the arrows are greyed out.
const bestSellers = [
  { image: '494324954_1183859846336540_5343954234173565708_n.jpg', name: 'Crown Diamond Ring' },
  { image: '494325447_1231333955173886_6890510470019316369_n.jpg', name: 'Gold Teddy Bear Ring' },
  { image: '494325961_638023342401034_6252364838369281331_n.jpg', name: 'Silver and Gold Pyramid Ring' },
]

export default function BestSellers() {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0) // card nearest the left edge (for the dots)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  // Work out which card is showing and whether the arrows can move further
  const update = () => {
    const track = trackRef.current
    if (!track) return
    const card = track.firstElementChild
    const step = card ? card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0) : 1
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
    // At the far right the last card may not reach the left edge, so count it as the last one
    setActive(end ? bestSellers.length - 1 : Math.min(bestSellers.length - 1, Math.round(track.scrollLeft / step)))
    setAtStart(track.scrollLeft <= 2)
    setAtEnd(end)
  }

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Move one card left (-1) or right (+1)
  const slide = (direction) => {
    const track = trackRef.current
    const card = track.firstElementChild
    track.scrollBy({ left: direction * (card.offsetWidth + 24), behavior: 'smooth' })
  }

  const goTo = (index) => {
    const card = trackRef.current.children[index]
    trackRef.current.scrollTo({ left: card.offsetLeft - trackRef.current.offsetLeft, behavior: 'smooth' })
  }

  return (
    <section className="best-sellers-section">
      <h2 className="best-sellers-title">Our Best Sellers</h2>
      <div className="best-sellers-carousel">
        <button type="button" className="carousel-arrow left" aria-label="Previous" onClick={() => slide(-1)} disabled={atStart}>
          &#8249;
        </button>
        <div className="carousel-track" ref={trackRef} onScroll={update}>
          {bestSellers.map((item) => (
            <div className="carousel-card" key={item.image}>
              <img src={`/uploads/products/${item.image}`} alt={item.name} />
              <div className="carousel-caption">{item.name}</div>
            </div>
          ))}
        </div>
        <button type="button" className="carousel-arrow right" aria-label="Next" onClick={() => slide(1)} disabled={atEnd}>
          &#8250;
        </button>
      </div>
      {/* Dots: which card is showing (only when not all cards fit) */}
      {!(atStart && atEnd) && (
        <div className="carousel-dots">
          {bestSellers.map((item, i) => (
            <button
              type="button"
              key={item.image}
              className={`carousel-dot ${i === active ? 'active' : ''}`}
              aria-label={`Show ${item.name}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
