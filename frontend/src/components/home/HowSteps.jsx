const steps = [
  { icon: 'bx-phone-call', title: 'Consult with Us', text: 'Share your vision, inspiration, and budget.' },
  { icon: 'bx-diamond', title: 'Watch the Magic', text: "We'll handcraft your piece with the finest materials." },
  { icon: 'bx-gift', title: 'Pickup in CDO', text: 'Once ready, pick it up at our store at your convenience.' },
]

export default function HowSteps() {
  return (
    <section className="how-steps-section" id="steps">
      <div className="container">
        <h2 className="how-steps-title">Your Dream Piece in 3 Simple Steps</h2>
        <p className="how-steps-desc">
          Looking for something uniquely yours? We make it easy to bring your vision to life with our
          custom jewelry service. Just follow these simple steps:
        </p>
        <div className="how-steps-row">
          {steps.map((step) => (
            <div className="how-step" key={step.title}>
              <i className={`bx ${step.icon}`}></i>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
