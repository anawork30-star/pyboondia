import { ArrowUpRight, Check } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { DATA_METHOD, DATA_PRINCIPLES } from '../data/content'
import { IMAGES } from '../data/images'

const STEP_COLORS = ['bg-violet text-paper', 'bg-lime text-ink', 'bg-coral text-ink', 'bg-blue text-paper']

export default function Strategy({ onQuote }) {
  return (
    <section id="estrategia" aria-labelledby="estrategia-title" className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="absolute -left-32 top-24 -z-10 h-96 w-96 rounded-full bg-lime/25 blur-3xl" />
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <SectionHeading
            id="estrategia-title"
            eyebrow="Estrategia basada en datos"
            title={
              <>
                Validamos los datos. <span className="text-violet">Decidimos con ellos.</span>
              </>
            }
            intro="La creatividad funciona mejor cuando sabe hacia dónde va. Por eso cada proyecto empieza con una estrategia: revisamos que tus datos sean confiables y tomamos las decisiones de marketing a partir de ellos."
            className="[&_.eyebrow]:text-violet"
          />
          <Reveal delay={120} className="relative">
            <div className="aspect-[16/10] overflow-hidden rounded-[2rem]">
              <Picture image={IMAGES.dataAnalytics} sizes="(min-width: 1024px) 40vw, 90vw" className="h-full w-full object-cover" />
            </div>
            <ul className="absolute -bottom-6 left-4 right-4 space-y-2 rounded-2xl bg-ink p-5 text-sm text-paper shadow-2xl sm:left-auto sm:w-80">
              {DATA_PRINCIPLES.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <ol className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DATA_METHOD.map((step, i) => (
            <Reveal
              as="li"
              key={step.title}
              delay={i * 90}
              className="relative flex flex-col rounded-[1.75rem] border border-ink/10 bg-white/70 p-6"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-full font-display text-xl font-extrabold ${STEP_COLORS[i]}`}>
                {i + 1}
              </span>
              <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
              {i < DATA_METHOD.length - 1 && (
                <span aria-hidden="true" className="absolute -right-3 top-9 z-10 hidden text-2xl text-ink/30 lg:block">
                  →
                </span>
              )}
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-8">
          <p className="max-w-2xl font-display text-2xl font-bold leading-tight sm:text-3xl">
            ¿No sabes si tus datos son confiables? <span className="text-lime">Empecemos por ahí.</span>
          </p>
          <a href="#contacto" onClick={() => onQuote('estrategia')} className="btn btn-light shrink-0">
            Quiero un diagnóstico <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
