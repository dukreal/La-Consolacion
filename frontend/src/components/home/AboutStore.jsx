const STORE_LOCATION = "https://www.google.com/maps/place/La+Consolacion+Jewelry/@8.4793738,124.6404635,1029m/data=!3m2!1e3!4b1!4m6!3m5!1s0x32fff2d78b3160c3:0x58d6709e18b5c78e!8m2!3d8.4793738!4d124.6430384!16s%2Fg%2F11gsbfpv_9?entry=ttu&g_ep=EgoyMDI1MDYyNi4wIKXMDSoASAFQAw%3D%3D"

export default function AboutStore() {
  return (
    <section className="about-store-section" id="about">
      <div className="container about-store-flex">
        {/* Row 1: Crafting */}
        <div className="about-row">
          <div className="about-img-col">
            <img src="/images/Create.png" alt="Crafting Jewelry" className="about-craft-img" />
          </div>
          <div className="about-text-col">
            <h2 className="about-title">The Heart Behind the Craft</h2>
            <p className="about-desc">
              At La Consolacion Jewelry, we believe jewelry isn&apos;t just an accessory—it&apos;s a
              story, a memory, and a piece of art. Based in Cagayan de Oro, each piece we make is
              lovingly handcrafted with precision, care, and passion. Whether you&apos;re selecting from
              our thoughtfully designed premade collections or working with us to create a custom
              piece, you&apos;re guaranteed something truly one-of-a-kind.
            </p>
          </div>
        </div>
        {/* Row 2: Visit the store */}
        <div className="about-row">
          <div className="about-text-col">
            <h2 className="store-title">Visit Our Store</h2>
            <p>
              Have a face-to-face consultation for your custom order or pickup your jewelry at our
              physical store.
            </p>
            <p className="store-name">
              <b>La Consolacion Jewelry</b>
              <br />
              170 Capistrano St, Cagayan De Oro City, Misamis Oriental
            </p>
            <p className="store-hours">Open every Mon–Sat, 9:00 AM – 5:00 PM</p>
            <a href={STORE_LOCATION} target="_blank" rel="noopener noreferrer" className="location-btn">
              See Location →
            </a>
          </div>
          <div className="about-img-col">
            <img src="/images/Map.png" alt="La Consolacion Jewelry Storefront" className="about-craft-img" />
          </div>
        </div>
      </div>
    </section>
  )
}
