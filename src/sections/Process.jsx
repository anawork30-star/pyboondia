import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { PROCESS } from '../data/content'

const DOTS = ['bg-coral', 'bg-violet', 'bg-blue', 'bg-lime', 'bg-paper']

export default function Process() {
  return (
    <section id="proceso" aria-labelledby="proceso-title" className="grain bg-ink py-24 text-paper sm:py-32">
      <div className="container-x">
        <SectionHeading
          id="proceso-title"
          tone="light"
          eyebrow="Proceso de trabajo"
          title={
            <>
              Un camino claro, <span className="text-lime">de la idea al lanzamiento</span>.
            </>
          }
          intro="Sabes en qué etapa está tu proyecto, qué recibes en cada una y cuándo es tu turno de revisar."
          className="[&_.eyebrow]:text-lime"
        />

        <ol className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {PROCESS.map((step, i) => (
            <Reveal
              as="li"
              key={step.title}
              delay={i * 90}
              className="group relative flex flex-col rounded-[1.75rem] border border-paper/15 bg-ink-soft/60 p-6 transition-colors hover:border-paper/40 lg:min-h-[22rem]"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-6xl font-extrabold leading-none text-paper/90">{i + 1}</span>
                <span className={`h-3 w-3 rounded-full ${DOTS[i]}`} aria-hidden="true" />
              </div>
              <h3 className="mt-8 text-xl font-bold leading-snug">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-paper/70">{step.text}</p>
              <p className="mt-auto pt-6 text-sm font-semibold text-lime">
                <span className="sr-only">Resultado: </span>→ {step.output}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
