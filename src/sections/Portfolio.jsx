import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, Plus, X } from 'lucide-react'
import Picture from '../components/Picture'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { CATEGORIES, PROJECTS } from '../data/portfolio'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
const SIZE = {
  tall: 'sm:row-span-2',
  wide: 'sm:col-span-2',
  regular: '',
}

export default function Portfolio({ onQuote }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const projects = useMemo(() => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)), [filter])

  return (
    <section id="portafolio" aria-labelledby="portafolio-title" className="bg-cream py-24 sm:py-32">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
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
          <div role="group" aria-label="Filtrar proyectos por categoría" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = filter === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(c.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'border-ink bg-ink text-paper' : 'border-ink/20 bg-paper/60 hover:border-ink'
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

        <ul className="mt-14 grid grid-flow-dense auto-rows-[19rem] gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[20rem]">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 80} className={SIZE[p.size]}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="group relative block h-full w-full overflow-hidden rounded-[1.75rem] bg-ink text-left text-paper"
                aria-haspopup="dialog"
              >
                <Picture
                  image={p.image}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                <span className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">{CATEGORY_LABEL[p.category]}</span>
                  {p.concept && (
                    <span className="rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-paper backdrop-blur">
                      Concepto demostrativo
                    </span>
                  )}
                </span>
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                  <span>
                    <span className="block font-display text-2xl font-bold leading-tight">{p.title}</span>
                    <span className="mt-1.5 block text-sm text-paper/80">{p.summary}</span>
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime text-ink transition-transform duration-300 group-hover:rotate-90">
                    <Plus size={20} aria-hidden="true" />
                    <span className="sr-only">Ver detalle</span>
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
