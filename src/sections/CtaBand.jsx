import { ArrowUpRight, MessageCircle } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import { CONTACT } from '../config/brand'
import { IMAGES } from '../data/images'

export default function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-violet px-6 py-16 text-paper sm:px-12 sm:py-20 lg:px-20 lg:py-24">
          <Picture
            image={IMAGES.abstractGradient}
            sizes="100vw"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime/40 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="eyebrow text-lime">¿Tienes una idea?</p>
            <h2 id="cta-title" className="mt-6 text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.95]">
              Cuéntanosla y la convertimos en un plan.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/85">
              Respóndenos unas preguntas sobre tu proyecto y te enviaremos una propuesta con alcance, tiempos e inversión.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#contacto" className="btn btn-light px-7 py-4 text-base">
                Solicitar propuesta <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              {CONTACT.whatsappUrl && (
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn border border-paper/40 px-7 py-4 text-base text-paper hover:bg-paper hover:text-ink"
                >
                  <MessageCircle size={18} aria-hidden="true" /> Escribir por WhatsApp
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
