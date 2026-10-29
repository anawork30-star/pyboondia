import { ArrowDown, ArrowUpRight } from 'lucide-react'
import Picture from '../components/Picture'
import { IMAGES } from '../data/images'
import { SERVICES } from '../data/services'

const MARQUEE = ['Branding', 'Redes sociales', 'Páginas web', 'Chatbots', 'Inteligencia artificial', 'Contenido', 'Automatización']

export default function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* Halos de color de fondo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute -right-24 top-64 h-[24rem] w-[24rem] rounded-full bg-coral/15 blur-3xl" />
      </div>

      <div className="container-x grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="relative z-10">
          <p className="eyebrow text-violet">Estudio creativo de marketing digital</p>
          <h1
            id="hero-title"
            className="mt-6 text-[clamp(2.75rem,7.4vw,6.25rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            Marcas que se{' '}
            <span className="relative inline-block">
              <span className="relative z-10">ven</span>
              <span aria-hidden="true" className="absolute inset-x-[-0.08em] bottom-[0.08em] -z-0 h-[0.32em] rounded-full bg-lime" />
            </span>
            , se <span className="pr-[0.06em] italic text-violet">sienten</span> y{' '}
            <span className="whitespace-nowrap">
              responden<span className="text-coral">.</span>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Unimos diseño, contenido, desarrollo web e inteligencia artificial para que tu negocio se vea profesional,
            conecte con su audiencia y atienda a sus clientes sin perder oportunidades.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contacto" className="btn btn-primary px-7 py-4 text-base">
              Hablemos de tu proyecto <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a href="#servicios" className="btn btn-outline px-7 py-4 text-base">
              Explorar servicios <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Servicios principales">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <a
                  href={`#servicio-${s.id}`}
                  className="inline-block rounded-full border border-ink/15 bg-white/60 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-ink hover:bg-white"
                >
                  {s.short}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <HeroCollage />
      </div>

      <div className="mt-20 border-y border-ink/10 bg-ink py-5 text-paper sm:mt-24" aria-hidden="true">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((word, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl font-semibold sm:text-3xl">
                {word}
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-lime" fill="currentColor">
                  <path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Composición editorial: fotografía principal + piezas flotantes que representan cada servicio. */
function HeroCollage() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[34rem] sm:aspect-[5/5.4]" aria-label="Collage de trabajos de diseño, redes, web e inteligencia artificial" role="img">
      {/* Bloque de color detrás */}
      <div className="absolute right-0 top-0 h-[78%] w-[82%] rounded-[2.5rem] bg-violet" />
      <div className="absolute bottom-[6%] left-0 h-[34%] w-[42%] rounded-[2rem] bg-coral" />

      {/* Foto principal */}
      <div className="absolute right-[6%] top-[6%] h-[72%] w-[74%] overflow-hidden rounded-[2rem] shadow-2xl shadow-ink/20">
        <Picture image={IMAGES.heroDesigner} sizes="(min-width: 1024px) 30vw, 70vw" priority className="h-full w-full object-cover" alt="" />
      </div>

      {/* Teléfono con feed */}
      <div
        className="float absolute bottom-[3%] left-[8%] w-[34%] overflow-hidden rounded-[1.6rem] border-[6px] border-ink bg-ink shadow-2xl"
        style={{ '--r': '-6deg' }}
      >
        <Picture image={IMAGES.heroPhone} sizes="(min-width: 1024px) 12vw, 30vw" className="aspect-[9/16] w-full object-cover" alt="" />
      </div>

      {/* Burbuja de chatbot */}
      <div
        className="float absolute bottom-[14%] right-[-2%] w-[56%] rounded-3xl bg-white p-4 shadow-xl shadow-ink/15 sm:right-[-4%]"
        style={{ animationDelay: '1.2s' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-[10px] font-bold text-ink">IA</span>
          Asistente virtual
          <span className="ml-auto h-2 w-2 rounded-full bg-[#1aa35c]" />
        </div>
        <p className="mt-3 rounded-2xl rounded-tl-sm bg-paper px-3 py-2 text-sm leading-snug">
          ¡Hola! ¿Quieres cotizar una página web o un chatbot?
        </p>
        <div className="mt-2 flex w-fit gap-1 rounded-2xl bg-violet-soft px-3 py-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-violet" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>

      {/* Paleta de marca */}
      <div className="float absolute left-[-2%] top-[10%] rounded-2xl bg-white p-3 shadow-xl shadow-ink/15" style={{ '--r': '4deg', animationDelay: '0.6s' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Paleta</p>
        <div className="mt-2 flex -space-x-2">
          {['#141218', '#5b3df5', '#ff5a3c', '#c8f04a'].map((c) => (
            <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Sello */}
      <div className="absolute right-[-1%] top-[-3%] grid h-24 w-24 rotate-12 place-items-center rounded-full bg-lime text-center font-display text-xs font-bold uppercase leading-tight tracking-wide text-ink shadow-lg sm:h-28 sm:w-28">
        Diseño
        <br />+ datos
        <br />+ IA
      </div>
    </div>
  )
}
