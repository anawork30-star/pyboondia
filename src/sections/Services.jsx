import { ArrowUpRight, Check } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { ADDITIONAL_SERVICES, SERVICES } from '../data/services'

const THEMES = {
  coral: { panel: 'bg-coral text-ink', muted: 'text-ink/75', chip: 'bg-ink/10', btn: 'btn-primary', rule: 'border-ink/20' },
  violet: { panel: 'bg-violet text-paper', muted: 'text-paper/80', chip: 'bg-paper/15', btn: 'btn-light', rule: 'border-paper/25' },
  ink: { panel: 'bg-ink text-paper', muted: 'text-paper/70', chip: 'bg-paper/10', btn: 'btn-light', rule: 'border-paper/20' },
  lime: { panel: 'bg-lime text-ink', muted: 'text-ink/75', chip: 'bg-ink/10', btn: 'btn-primary', rule: 'border-ink/20' },
  blue: { panel: 'bg-blue text-paper', muted: 'text-paper/85', chip: 'bg-paper/15', btn: 'btn-light', rule: 'border-paper/25' },
}

export default function Services({ onQuote }) {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="py-24 sm:py-32">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="servicios-title"
            eyebrow="Servicios"
            title={
              <>
                Todo empieza por la <span className="text-violet">estrategia</span>. Lo demás la ejecuta.
              </>
            }
          />
          <Reveal as="p" delay={120} className="max-w-sm text-lg leading-relaxed text-muted">
            Puedes contratar cada servicio por separado o en un plan integral. Siempre con una estrategia y datos validados
            detrás.
          </Reveal>
        </div>

        <div className="mt-16 flex flex-col gap-6 lg:gap-8">
          {SERVICES.map((service, i) => (
            <ServicePanel key={service.id} service={service} index={i} onQuote={onQuote} />
          ))}
        </div>

        <AdditionalServices onQuote={onQuote} />
      </div>
    </section>
  )
}

function AdditionalServices({ onQuote }) {
  return (
    <Reveal className="mt-10 rounded-[2rem] border border-dashed border-ink/25 p-6 sm:p-10">
      <p className="eyebrow text-muted">Servicios adicionales con aliados</p>
      {ADDITIONAL_SERVICES.map((s) => (
        <div key={s.id} className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h3 className="text-2xl font-bold sm:text-3xl">{s.title}</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">{s.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.items.map((item) => (
                <li key={item} className="rounded-full bg-cream px-3 py-1 text-sm font-medium">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <a href="#contacto" onClick={() => onQuote(s.id)} className="btn btn-outline self-start lg:self-end">
            Consultar <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      ))}
    </Reveal>
  )
}

function ServicePanel({ service, index, onQuote }) {
  const t = THEMES[service.theme]
  const reverse = index % 2 === 1
  return (
    <article
      id={`servicio-${service.id}`}
      aria-labelledby={`servicio-${service.id}-title`}
      // Efecto de tarjetas apiladas solo si la pantalla es lo bastante alta para ver cada panel completo.
      // `top` va dentro de la misma condición: aplicado a un panel relativo lo desplazaría.
      className={`grain overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] lg:[@media(min-height:1000px)]:sticky lg:[@media(min-height:1000px)]:top-(--stick-top) ${t.panel}`}
      style={{ '--stick-top': `${6 + index * 1.5}rem` }}
    >
      <div className={`grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] lg:aspect-[5/4]">
            <Picture image={service.image} sizes="(min-width: 1024px) 40vw, 90vw" className="h-full w-full object-cover" />
          </div>
          <ServiceAccent id={service.id} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${t.chip}`}>{service.short}</span>
            <span className="font-display text-5xl font-extrabold opacity-30 sm:text-6xl" aria-hidden="true">
              {service.number}
            </span>
          </div>
          <h3 id={`servicio-${service.id}-title`} className="mt-6 text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl">
            {service.title}
          </h3>
          <p className="mt-3 font-display text-xl font-medium">{service.pitch}</p>
          <p className={`mt-4 leading-relaxed ${t.muted}`}>{service.description}</p>

          <ul className={`mt-6 grid gap-x-6 gap-y-2.5 border-t pt-6 sm:grid-cols-2 ${t.rule}`}>
            {service.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2.5 text-[15px] font-medium">
                <Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                {d}
              </li>
            ))}
          </ul>

          <div className={`mt-6 space-y-2 text-[15px] leading-relaxed ${t.muted}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">Beneficios</p>
            {service.benefits.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>

          <div className="mt-8 lg:mt-auto lg:pt-8">
            <a href="#contacto" onClick={() => onQuote(service.id)} className={`btn ${t.btn}`}>
              Cotizar {service.short.toLowerCase()} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Detalle gráfico propio de cada servicio, superpuesto a la fotografía. */
function ServiceAccent({ id }) {
  const base = 'absolute rounded-2xl bg-white p-3 text-ink shadow-xl shadow-ink/20'
  if (id === 'estrategia')
    return (
      <ol className={`${base} -bottom-4 right-4 flex items-center gap-1.5 text-xs font-semibold sm:right-6`} aria-hidden="true">
        {['Hipótesis', 'Dato validado', 'Decisión'].map((step, i) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-1 ${i === 2 ? 'bg-lime' : 'bg-paper'}`}>{step}</span>
            {i < 2 && <span className="text-muted">→</span>}
          </li>
        ))}
      </ol>
    )
  if (id === 'ugc')
    return (
      <ul className={`${base} -bottom-4 left-4 w-48 space-y-1.5 text-xs font-medium sm:left-6`} aria-hidden="true">
        {['Brief creativo', 'Guion aprobado', 'Derechos de uso'].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-coral text-[10px] text-ink">✓</span>
            {item}
          </li>
        ))}
      </ul>
    )
  if (id === 'social')
    return (
      <div className={`${base} -bottom-4 left-4 w-44 sm:left-6`} aria-hidden="true">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Calendario</p>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={`h-4 rounded ${[1, 3, 5, 8, 10, 12].includes(i) ? 'bg-violet' : 'bg-paper'}`} />
          ))}
        </div>
      </div>
    )
  if (id === 'web')
    return (
      <div className={`${base} -bottom-4 right-4 w-48 sm:right-6`} aria-hidden="true">
        <div className="flex gap-1">
          {['#ff5a3c', '#f5c542', '#1aa35c'].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-3 h-2 w-3/4 rounded bg-ink" />
        <div className="mt-1.5 h-2 w-1/2 rounded bg-ink/20" />
        <div className="mt-3 h-5 w-20 rounded-full bg-lime" />
      </div>
    )
  return (
    <div className={`${base} -bottom-4 left-4 w-56 space-y-2 sm:left-6`} aria-hidden="true">
      <p className="w-fit rounded-xl rounded-tl-sm bg-paper px-3 py-1.5 text-xs">¿Tienen horario el sábado?</p>
      <p className="ml-auto w-fit rounded-xl rounded-tr-sm bg-ink px-3 py-1.5 text-xs text-paper">Sí, de 9 a. m. a 1 p. m. ¿Agendo tu cita?</p>
    </div>
  )
}
