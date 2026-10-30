import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, X } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { CATEGORIES, PROJECTS } from '../data/portfolio'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

export default function Portfolio({ onQuote }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const projects = useMemo(() => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)), [filter])

  return (
    <section id="portafolio" aria-labelledby="portafolio-title" className="py-24 sm:py-32">
      <div className="container-x">
        <div className="flex flex-col gap-10">
          <SectionHeading
            id="portafolio-title"
            eyebrow="Portafolio"
            title={
              <>
                Ideas puestas <span className="italic text-coral">en escena</span>.
              </>
            }
            intro="Una muestra del tipo de proyectos que diseñamos. Son conceptos demostrativos creados para ilustrar nuestro enfoque, no casos de clientes."
          />
          <div
            role="group"
            aria-label="Filtrar proyectos por categoría"
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:w-fit lg:flex-nowrap lg:rounded-full lg:bg-white lg:p-1 lg:shadow-[0_8px_30px_-12px_rgb(20_18_24/0.2)] lg:ring-1 lg:ring-ink/5"
          >
            {CATEGORIES.map((c) => {
              const active = filter === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(c.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-ink text-paper' : 'bg-white text-ink/70 ring-1 ring-ink/10 hover:text-ink lg:bg-transparent lg:ring-0'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {projects.length} proyectos en {CATEGORY_LABEL[filter]}
        </p>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 80}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                aria-haspopup="dialog"
                className="group flex h-full w-full flex-col rounded-[1.75rem] bg-white p-2.5 text-left shadow-[0_18px_50px_-24px_rgb(20_18_24/0.25)] ring-1 ring-ink/5 transition-[transform,box-shadow] duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgb(20_18_24/0.35)]"
              >
                <span className="relative block aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-cream">
                  <Picture
                    image={p.image}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
                  />
                  {p.concept && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
                      Concepto demostrativo
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col px-3 pb-3 pt-5">
                  <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {CATEGORY_LABEL[p.category]}
                    <span aria-hidden="true">{String(PROJECTS.indexOf(p) + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="mt-3 block font-display text-xl font-bold leading-snug">{p.title}</span>
                  <span className="mt-2 line-clamp-2 block text-[15px] leading-relaxed text-muted">{p.summary}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-violet">
                    Ver proyecto
                    <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <ProjectDialog project={selected} onClose={() => setSelected(null)} onQuote={onQuote} />
    </section>
  )
}

function ProjectDialog({ project, onClose, onQuote }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (project && !dialog.open) dialog.showModal()
    if (!project && dialog.open) dialog.close()
  }, [project])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="proyecto-titulo"
      className="m-auto max-h-[92vh] w-[min(64rem,calc(100%-2rem))] overflow-y-auto rounded-[2rem] bg-paper p-0 text-ink"
    >
      {project && (
        <article className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Picture image={project.image} sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="relative p-6 sm:p-10">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink text-paper hover:bg-violet"
              aria-label="Cerrar detalle del proyecto"
              autoFocus
            >
              <X size={20} aria-hidden="true" />
            </button>
            <p className="eyebrow text-violet">{CATEGORY_LABEL[project.category]}</p>
            <h3 id="proyecto-titulo" className="mt-4 pr-12 text-3xl font-bold leading-tight sm:text-4xl">
              {project.title}
            </h3>
            {project.concept && (
              <p className="mt-4 rounded-2xl bg-violet-soft px-4 py-3 text-sm text-ink">
                Concepto demostrativo: ilustra nuestro enfoque de trabajo. No corresponde a un cliente real ni a resultados medidos.
              </p>
            )}
            <h4 className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-muted">El reto</h4>
            <p className="mt-2 leading-relaxed">{project.challenge}</p>
            <h4 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Cómo lo abordamos</h4>
            <p className="mt-2 leading-relaxed">{project.approach}</p>
            <h4 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Entregables</h4>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {project.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm font-medium">
                  <Check size={16} className="mt-0.5 shrink-0 text-violet" aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
            <a
              href="#contacto"
              onClick={() => {
                onQuote(project.category)
                onClose()
              }}
              className="btn btn-primary mt-8"
            >
              Quiero algo así <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </article>
      )}
    </dialog>
  )
}
