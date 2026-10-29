import { useState } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import About from '../sections/About'
import Contact from '../sections/Contact'
import CtaBand from '../sections/CtaBand'
import Hero from '../sections/Hero'
import Portfolio from '../sections/Portfolio'
import Process from '../sections/Process'
import Services from '../sections/Services'
import Strategy from '../sections/Strategy'

export default function Home() {
  // Objeto nuevo en cada clic para que el formulario se actualice aunque se repita el servicio.
  const [preset, setPreset] = useState(null)
  const onQuote = (id) => setPreset({ id })

  return (
    <>
      <Header />
      <main id="contenido">
        <Hero />
        <Strategy onQuote={onQuote} />
        <Services onQuote={onQuote} />
        <Portfolio onQuote={onQuote} />
        <About />
        <Process />
        <CtaBand />
        <Contact presetService={preset} />
      </main>
      <Footer />
    </>
  )
}
