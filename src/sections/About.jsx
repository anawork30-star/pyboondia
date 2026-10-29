import { Check } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BENEFITS, PILLARS } from '../data/content'
import { IMAGES } from '../data/images'

const ACCENT = {
  coral: 'bg-coral text-ink',
  violet: 'bg-violet text-paper',
  lime: 'bg-lime text-ink',
}

export default function About() {
  return (
    <section id="nosotros" aria-labelledby="nosotros-title" className="overflow-hidden py-24 sm:py-32">
      <div className="container-x grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <Reveal className="relative aspect-[4/5] w-[82%] overflow-hidden rounded-[2rem]">
            <Picture image={IMAGES.teamWorkshop} sizes="(min-width: 1024px) 36vw, 80vw" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal
            delay={150}
            className="absolute -bottom-8 right-0 aspect-square w-[48%] overflow-hidden rounded-[1.75rem] border-8 border-paper"
          >
            <Picture image={IMAGES.teamStudio} sizes="(min-width: 1024px) 20vw, 45vw" className="h-full w-full object-cover" />
          </Reveal>
          <div
            aria-hidden="true"
            className="absolute -left-4 top-8 rotate-[-8deg] rounded-full bg-lime px-5 py-2 font-display text-sm font-bold shadow-lg"
          >
            Decisiones con datos
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            id="nosotros-title"
            eyebrow="Nosotros"
            title={
              <>
                Estrategia primero. <span className="text-violet">Creatividad y tecnología después.</span>
              </>
            }
            intro="Somos una agencia que piensa primero como estratega: validamos los datos, tomamos decisiones con ellos y luego los convertimos en contenido, alianzas con creadores UGC, sitios web y automatizaciones. Así cada proyecto se ve bien y, sobre todo, funciona para tu negocio."
          />

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 90} className={`rounded-[1.5rem] p-5 ${ACCENT[p.accent]}`}>
                <p className="font-display text-xl font-bold">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-90">{p.text}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120} className="mt-10">
            <h3 className="font-display text-2xl font-bold">Lo que buscamos lograr contigo</h3>
            <ul className="mt-5 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[17px] leading-relaxed">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-lime">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
