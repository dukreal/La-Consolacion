import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AboutStore from '../../components/home/AboutStore'
import BestSellers from '../../components/home/BestSellers'
import CustomJourney from '../../components/home/CustomJourney'
import Footer from '../../components/home/Footer'
import Hero from '../../components/home/Hero'
import HowSteps from '../../components/home/HowSteps'
import LoginNotifyModal from '../../components/home/LoginNotifyModal'
import ReadySection from '../../components/home/ReadySection'

export default function Home() {
  const { hash, key } = useLocation()

  // The header and footer link to /#steps and /#about. React Router does not scroll
  // to those by itself, so we do it here.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash, key])

  return (
    <>
      <Hero />
      <BestSellers />
      <ReadySection />
      <HowSteps />
      <CustomJourney />
      <AboutStore />
      <Footer />
      <LoginNotifyModal />
    </>
  )
}
