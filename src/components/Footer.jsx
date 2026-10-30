import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'
import Logo from './Logo'
import { BRAND, CONTACT, LEGAL_LINKS, NAV, SOCIALS } from '../config/brand'
import { SERVICES } from '../data/services'

export default function Footer({ onHome = true }) {
  const base = onHome ? '' : '/'
  const year = new Date().getFullYear()
  return (
    <footer className="grain bg-ink text-paper">
      <div className="container-x py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo tone="light" className="h-16 w-auto" />
            <p className="mt-5 leading-relaxed text-paper/70">{BRAND.description}</p>
            <a href={`${base}#contacto`} className="btn btn-light mt-7">
              Hablemos de tu proyecto <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-lime">Servicios</h2>
            <ul className="mt-5 space-y-3 text-paper/80">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <a className="hover:text-paper" href={`${base}#servicio-${s.id}`}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-lime">Navegación</h2>
            <ul className="mt-5 space-y-3 text-paper/80">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a className="hover:text-paper" href={`${base}#${n.id}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-lime">Contacto</h2>
            <ul className="mt-5 space-y-3 text-paper/80">
              {CONTACT.email && (
                <li>
                  <a className="inline-flex items-center gap-2 break-all hover:text-paper" href={`mailto:${CONTACT.email}`}>
                    <Mail size={16} aria-hidden="true" /> {CONTACT.email}
                  </a>
                </li>
              )}
              {CONTACT.whatsappUrl && (
                <li>
                  <a
                    className="inline-flex items-center gap-2 hover:text-paper"
                    href={CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                  </a>
                </li>
              )}
              <li>
                <a className="hover:text-paper" href={`${base}#contacto`}>
                  Formulario de contacto
                </a>
              </li>
              {BRAND.city && <li className="text-paper/60">{BRAND.city}</li>}
            </ul>
            {SOCIALS.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Redes sociales">
                {SOCIALS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full border border-paper/20 px-3 py-1.5 text-sm hover:border-lime hover:text-lime"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-16 flex justify-end opacity-[0.08]">
          <Logo tone="light" label={false} className="h-auto w-1/2 max-w-[22rem]" />
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-paper/15 pt-8 text-sm text-paper/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {BRAND.legalName}. Todos los derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <a className="hover:text-paper" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
