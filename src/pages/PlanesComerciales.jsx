import { useEffect, useState } from 'react'
import { Bot, Check, Globe, Info, LoaderCircle, LogOut, Minus, ShieldCheck, Star } from 'lucide-react'
import Logo from '../components/Logo'
import Reveal from '../components/Reveal'
import { LOGIN_PATH, PORTAL_PATH, fetchPortalContent, getSession, signOut, watchSession } from '../lib/auth.js'

// Toda la información comercial (planes, precios, condiciones) llega desde Supabase después de
// validar la sesión y la pertenencia a portal_members. Este archivo solo contiene el diseño.

const ACCENTS = {
  violet: { bar: 'bg-violet', text: 'text-violet', check: 'bg-violet text-paper', ring: 'ring-violet' },
  blue: { bar: 'bg-blue', text: 'text-blue', check: 'bg-blue text-paper', ring: 'ring-blue' },
  lime: { bar: 'bg-lime', text: 'text-ink', check: 'bg-lime text-ink', ring: 'ring-lime' },
  coral: { bar: 'bg-coral', text: 'text-[#c2341a]', check: 'bg-coral text-ink', ring: 'ring-coral' },
}
const ADDON_ICON = { web: Globe, bots: Bot }

// Evita que el aviso de "sesión expirada" aparezca cuando la persona cierra sesión a propósito.
let loggingOut = false

const toLogin = (reason) =>
  window.location.replace(`${LOGIN_PATH}?${reason}&next=${encodeURIComponent(PORTAL_PATH)}`)

export default function PlanesComerciales() {
  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error
  const [email, setEmail] = useState('')
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let stop = () => {}
    ;(async () => {
      const session = await getSession().catch(() => null)
      if (!session) return toLogin('acceso')
      setEmail(session.user.email ?? '')
      stop = await watchSession(() => !loggingOut && toLogin('expirada'))
      try {
        setState({ status: 'ready', data: await fetchPortalContent() })
      } catch (err) {
        if (err.code === 'EXPIRED') return toLogin('expirada')
        setState({ status: 'error', message: err.message })
      }
    })()
    return () => stop()
  }, [])

  async function logout() {
    setLeaving(true)
    loggingOut = true
    await signOut().catch(() => {})
    window.location.replace(`${LOGIN_PATH}?salida`)
  }

  return (
    <>
      <PortalBar email={email} onLogout={logout} leaving={leaving} />
      <main id="contenido" className="pb-24 pt-28 sm:pt-32">
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' && <ErrorState message={state.message} onLogout={logout} />}
        {state.status === 'ready' && <Portal data={state.data} />}
      </main>
    </>
  )
}

function PortalBar({ email, onLogout, leaving }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 py-3">
      <div className="container-x">
        <div className="flex items-center justify-between gap-3 rounded-full bg-white/85 py-2 pl-5 pr-2 shadow-[0_12px_40px_-12px_rgb(20_18_24/0.25)] ring-1 ring-ink/5 backdrop-blur-xl sm:pl-6">
          <div className="flex items-center gap-3">
            <a href="/" aria-label="AIDU, ir al sitio público" className="shrink-0">
              <Logo label={false} className="h-9 w-auto" />
            </a>
            <span className="hidden items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet sm:inline-flex">
              <ShieldCheck size={14} aria-hidden="true" /> Sección privada
            </span>
          </div>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-sm text-muted md:inline">{email.split('@')[0]}</span>}
            <button type="button" onClick={onLogout} disabled={leaving} className="btn btn-primary px-4 py-2.5 sm:px-5">
              {leaving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function Loading() {
  return (
    <div className="container-x" role="status">
      <span className="sr-only">Cargando planes comerciales…</span>
      <div className="h-6 w-48 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-6 h-16 w-3/4 max-w-2xl animate-pulse rounded-2xl bg-ink/10" />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-[2rem] bg-white ring-1 ring-ink/5" />
        ))}
      </div>
    </div>
  )
}

function ErrorState({ message, onLogout }) {
  return (
    <div className="container-x max-w-xl text-center">
      <h1 className="text-3xl font-bold">No pudimos mostrar los planes</h1>
      <p className="mt-4 text-muted">{message}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
          Intentar de nuevo
        </button>
        <button type="button" onClick={onLogout} className="btn btn-outline">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function Portal({ data }) {
  const { intro, groups, plans, comparison, addons, notes } = data
  return (
    <>
      {/* Encabezado */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute -left-40 top-0 -z-10 h-[26rem] w-[26rem] rounded-full bg-violet/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-24 top-24 -z-10 h-80 w-80 rounded-full bg-lime/25 blur-3xl" />
        <div className="container-x">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet shadow-sm ring-1 ring-ink/5">
            <ShieldCheck size={14} aria-hidden="true" /> Contenido confidencial · {intro.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.6rem,6.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            Nuestros planes <span className="text-violet">comerciales</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            <strong className="font-semibold text-ink">{intro.title}.</strong> {intro.subtitle} Cada nivel combina estrategia,
            contenido, pauta y acompañamiento para hacer crecer las ventas de nuestros clientes.
          </p>
          <dl className="mt-10 grid gap-3 sm:grid-cols-3">
            {intro.highlights.map((h) => (
              <div key={h.label} className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_50px_-24px_rgb(20_18_24/0.25)] ring-1 ring-ink/5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{h.label}</dt>
                <dd className="mt-2 font-display text-xl font-bold">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Planes por grupo, como en la propuesta */}
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`grupo-${g.id}`} className="container-x mt-20">
          <p className="eyebrow text-violet">{g.eyebrow}</p>
          <h2 id={`grupo-${g.id}`} className="mt-3 text-3xl font-bold sm:text-4xl">
            {g.title}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {plans
              .filter((p) => p.group === g.id)
              .map((p, i) => (
                <PlanCard key={p.number} plan={p} delay={i * 100} />
              ))}
          </div>
        </section>
      ))}

      {/* Comparativo */}
      <section aria-labelledby="comparativo" className="container-x mt-20">
        <p className="eyebrow text-violet">Comparativo</p>
        <h2 id="comparativo" className="mt-3 text-3xl font-bold sm:text-4xl">
          Diferencias entre planes
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Los mismos entregables de cada plan, organizados por tema. <Minus size={14} className="inline" aria-hidden="true" />{' '}
          indica que el entregable no figura en la propuesta para ese plan.
        </p>
        {/* contain:paint evita que la tabla ancha agrande la página en navegadores móviles. */}
        <div className="mt-8 overflow-x-auto rounded-[1.75rem] bg-white shadow-[0_18px_50px_-24px_rgb(20_18_24/0.25)] ring-1 ring-ink/5 [contain:paint]">
          <table className="w-full min-w-[56rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-ink/10">
                <th scope="col" className="sticky left-0 bg-white px-5 py-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Aspecto
                </th>
                {plans.map((p) => (
                  <th key={p.number} scope="col" className="px-5 py-5 align-bottom">
                    <span className={`mb-2 block h-1 w-10 rounded-full ${ACCENTS[p.accent].bar}`} aria-hidden="true" />
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Plan {p.number}</span>
                    <span className="block font-display text-lg font-bold">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.aspect} className="border-b border-ink/5 last:border-0 even:bg-paper/50">
                  <th scope="row" className="sticky left-0 bg-inherit px-5 py-4 font-semibold">
                    {row.aspect}
                  </th>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-5 py-4 align-top text-ink/85">
                      {v ?? (
                        <>
                          <Minus size={16} className="text-ink/30" aria-hidden="true" />
                          <span className="sr-only">No figura en la propuesta</span>
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Servicios adicionales */}
      <section aria-labelledby="adicionales" className="container-x mt-20">
        <p className="eyebrow text-violet">Servicios adicionales</p>
        <h2 id="adicionales" className="mt-3 text-3xl font-bold sm:text-4xl">
          Proyectos de pago único
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {addons.map((a, i) => {
            const Icon = ADDON_ICON[a.id] ?? Globe
            return (
              <Reveal
                key={a.id}
                delay={i * 100}
                className={`grain rounded-[2rem] p-6 sm:p-8 ${a.id === 'web' ? 'bg-ink text-paper' : 'bg-violet text-paper'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-lime text-ink">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold">{a.title}</h3>
                    <p className="text-sm text-paper/70">{a.billing}</p>
                  </div>
                </div>
                <ul className="mt-6 divide-y divide-paper/15">
                  {a.items.map((it) => (
                    <li key={it.name} className="flex items-baseline justify-between gap-4 py-3.5">
                      <span className="font-medium">{it.name}</span>
                      <span className="font-display text-2xl font-bold text-lime">{it.price}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Condiciones */}
      <section aria-labelledby="condiciones" className="container-x mt-20">
        <div className="rounded-[2rem] border border-dashed border-ink/20 p-6 sm:p-8">
          <h2 id="condiciones" className="flex items-center gap-2 text-xl font-bold">
            <Info size={20} className="text-violet" aria-hidden="true" /> Condiciones y notas
          </h2>
          <ul className="mt-4 space-y-2 text-muted">
            {notes.map((n) => (
              <li key={n} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-center text-xs uppercase tracking-[0.22em] text-muted">
          Información confidencial · Uso exclusivo del equipo AIDU
        </p>
      </section>
    </>
  )
}

function PlanCard({ plan, delay }) {
  const a = ACCENTS[plan.accent] ?? ACCENTS.violet
  return (
    <Reveal
      as="article"
      delay={delay}
      aria-labelledby={`plan-${plan.number}`}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] bg-white p-7 shadow-[0_18px_50px_-24px_rgb(20_18_24/0.25)] ring-1 transition-[transform,box-shadow] duration-500 ease-out-soft hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-28px_rgb(20_18_24/0.4)] sm:p-9 ${
        plan.highlighted ? `ring-2 ${a.ring}` : 'ring-ink/5'
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${a.bar}`} />
      {plan.popular && (
        <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-lime">
          <Star size={12} aria-hidden="true" fill="currentColor" /> {plan.label}
        </span>
      )}
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${a.text}`}>
        Plan {plan.number}
        {!plan.popular && ` · ${plan.label}`}
      </p>
      <h3 id={`plan-${plan.number}`} className="mt-3 text-3xl font-bold">
        {plan.name}
      </h3>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-5xl font-extrabold tracking-tight">{plan.price}</span>
        <span className="text-lg font-medium text-muted">{plan.period}</span>
      </p>
      <p className="mt-2 text-sm text-muted">{plan.setup}</p>
      <ul className="mt-7 space-y-3.5 border-t border-ink/10 pt-7">
        {plan.features.map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${a.check}`}>
              <Check size={14} aria-hidden="true" />
            </span>
            <span className="leading-relaxed">
              <strong className="font-semibold">{f.title}</strong> <span className="text-ink/75">{f.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}
