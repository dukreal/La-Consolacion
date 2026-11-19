const CONSULTATION_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdQcpfmLP5goLEnyX1elKV9T4KNeoWwgSjwtMcBNWBdTsjRSA/viewform?usp=header"

export default function CustomJourney() {
  return (
    <section className="custom-journey-section">
      <div className="custom-journey-container">
        <div className="custom-journey-content">
          <h2 className="custom-journey-title">Start Your Custom Journey</h2>
          <p className="custom-journey-desc">
            Some stories can&apos;t be told with ready-made pieces. Collaborate with our artisans to
            design jewelry that&apos;s truly personal—crafted around your ideas, style, and meaning.
            From one-of-a-kind heirlooms to deeply symbolic keepsakes, we&apos;ll turn your vision into
            something real.
          </p>
          <a
            href={CONSULTATION_FORM}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-journey-btn"
          >
            Book a Consultation <span className="custom-journey-arrow">→</span>
          </a>
        </div>
        <div className="custom-journey-image">
          <img src="/images/necklace.png" alt="Custom Jewelry Consultation" />
        </div>
      </div>
    </section>
  )
}
