import { ArrowUpRight } from 'lucide-react'
import Footer from '../components/Footer'
import Header from '../components/Header'

export default function NotFound() {
  return (
    <>
      <Header onHome={false} />
      <main id="contenido" className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
        <div aria-hidden="true" className="absolute -right-32 top-20 -z-10 h-96 w-96 rounded-full bg-violet/20 blur-3xl" />
        <div className="container-x">
          <p className="eyebrow text-coral">Error 404</p>
          <h1 className="mt-6 text-[clamp(3rem,10vw,8rem)] font-extrabold leading-[0.9]">
            Esta página
            <br />
            <span className="text-violet">no está en el brief.</span>
          </h1>
          <p className="mt-8 max-w-lg text-lg text-muted">
            Es posible que el enlace haya cambiado o ya no exista. Vuelve al inicio y sigue explorando.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="/" className="btn btn-primary px-7 py-4 text-base">
              Volver al inicio <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a href="/#contacto" className="btn btn-outline px-7 py-4 text-base">
              Contactarnos
            </a>
          </div>
        </div>
      </main>
      <Footer onHome={false} />
    </>
  )
}
