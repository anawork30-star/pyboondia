import { useId, useRef, useState } from 'react'
import { ArrowUpRight, CircleAlert, CircleCheck, LoaderCircle, Mail, MessageCircle } from 'lucide-react'
import Reveal from '../components/Reveal'
import { CONTACT } from '../config/brand'
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from '../data/services'
import { EMPTY_FORM, LIMITS, submitContact, validateContact } from '../lib/contact.js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js'

export default function Contact({ presetService }) {
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [serverError, setServerError] = useState('')
  const formRef = useRef(null)
  const statusRef = useRef(null)

  // Preselecciona el servicio cuando el usuario llega desde un CTA de servicio o proyecto.
  const [lastPreset, setLastPreset] = useState(presetService)
  if (presetService !== lastPreset) {
    setLastPreset(presetService)
    if (presetService) setValues((v) => ({ ...v, service: presetService.id }))
  }

  const set = (name) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (status === 'sending') return
    const found = validateContact(values)
    setErrors(found)
    if (Object.keys(found).length) {
      const first = formRef.current?.querySelector(`[name="${Object.keys(found)[0]}"]`)
      first?.focus()
      return
    }
    setStatus('sending')
    setServerError('')
    try {
      await submitContact(await getSupabase(), values)
      setStatus('success')
      setValues(EMPTY_FORM)
    } catch (err) {
      setServerError(err.message)
      setStatus('error')
    }
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-cream py-24 sm:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-coral">Contacto</p>
          <h2 id="contacto-title" className="mt-5 text-4xl font-bold leading-[1.02] sm:text-5xl lg:text-6xl">
            Hablemos de tu proyecto.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Cuéntanos qué necesitas. Revisamos cada solicitud y te respondemos con los siguientes pasos y, si aplica, una
            propuesta a tu medida.
          </p>

          <ul className="mt-10 space-y-3">
            {CONTACT.email && (
              <li>
                <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-3 font-semibold">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper transition-colors group-hover:bg-violet">
                    <Mail size={18} aria-hidden="true" />
                  </span>
                  <span className="break-all">{CONTACT.email}</span>
                </a>
              </li>
            )}
            {CONTACT.whatsappUrl && (
              <li>
                <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 font-semibold">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper transition-colors group-hover:bg-[#1aa35c]">
                    <MessageCircle size={18} aria-hidden="true" />
                  </span>
                  Escríbenos por WhatsApp
                </a>
              </li>
            )}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            aria-labelledby="contacto-title"
            className="rounded-[2rem] bg-paper p-6 shadow-[0_30px_80px_-40px_rgb(20_18_24/0.35)] sm:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nombre" name="name" error={errors.name} required>
                {(p) => <input {...p} type="text" autoComplete="name" maxLength={LIMITS.name[1]} value={values.name} onChange={set('name')} />}
              </Field>
              <Field label="Correo electrónico" name="email" error={errors.email} required>
                {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email} value={values.email} onChange={set('email')} />}
              </Field>
              <Field label="Empresa" name="company" error={errors.company} optional>
                {(p) => <input {...p} type="text" autoComplete="organization" maxLength={LIMITS.company[1]} value={values.company} onChange={set('company')} />}
              </Field>
              <Field label="Servicio de interés" name="service" error={errors.service} required>
                {(p) => (
                  <select {...p} value={values.service} onChange={set('service')}>
                    <option value="">Selecciona una opción</option>
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Presupuesto estimado" name="budget" error={errors.budget} optional className="sm:col-span-2">
                {(p) => (
                  <select {...p} value={values.budget} onChange={set('budget')}>
                    <option value="">Prefiero no indicarlo</option>
                    {BUDGET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field
                label="Descripción del proyecto"
                name="message"
                error={errors.message}
                required
                className="sm:col-span-2"
                hint={`${values.message.trim().length}/${LIMITS.message[1]}`}
              >
                {(p) => (
                  <textarea
                    {...p}
                    rows={5}
                    maxLength={LIMITS.message[1]}
                    placeholder="¿Qué quieres lograr? ¿Tienes fechas o referencias?"
                    value={values.message}
                    onChange={set('message')}
                    className={`${p.className} resize-y`}
                  />
                )}
              </Field>
            </div>

            {/* Honeypot anti-spam: oculto para personas y lectores de pantalla */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
              <label>
                Sitio web
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
              </label>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-3 text-[15px] leading-relaxed">
                <input
                  type="checkbox"
                  name="consent"
                  checked={values.consent}
                  onChange={set('consent')}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? 'consent-error' : undefined}
                  className="mt-1 h-5 w-5 shrink-0 accent-violet"
                />
                <span>
                  Acepto la{' '}
                  <a href="/privacidad/" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4 hover:text-violet">
                    política de tratamiento de datos personales
                  </a>{' '}
                  y autorizo el uso de mis datos para responder a esta solicitud.
                </span>
              </label>
              {errors.consent && (
                <p id="consent-error" className="field-error">
                  {errors.consent}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" className="btn btn-primary px-8 py-4 text-base" disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Enviando…
                  </>
                ) : (
                  <>
                    Enviar solicitud <ArrowUpRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="text-sm text-muted">Los campos marcados con * son obligatorios.</p>
            </div>

            <div ref={statusRef} tabIndex={-1} aria-live="polite" className="mt-6 outline-none">
              {status === 'success' && (
                <p className="flex items-start gap-3 rounded-2xl bg-lime/60 px-5 py-4 font-medium">
                  <CircleCheck size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  ¡Gracias! Recibimos tu solicitud y te contactaremos pronto.
                </p>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-3 rounded-2xl bg-coral-soft px-5 py-4 font-medium" role="alert">
                  <CircleAlert size={20} className="mt-0.5 shrink-0 text-[#c2341a]" aria-hidden="true" />
                  <div>
                    <p>{serverError}</p>
                    {!isSupabaseConfigured && CONTACT.email && (
                      <p className="mt-1 text-sm">
                        También puedes escribirnos a{' '}
                        <a className="underline" href={`mailto:${CONTACT.email}`}>
                          {CONTACT.email}
                        </a>
                        .
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

function Field({ label, name, error, required, optional, hint, className = '', children }) {
  const uid = useId()
  const id = `${name}-${uid}`
  const errorId = `${id}-error`
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label flex justify-between gap-2">
        <span>
          {label}
          {required && <span aria-hidden="true"> *</span>}
          {optional && <span className="font-normal text-muted"> (opcional)</span>}
        </span>
        {hint && (
          <span className="font-normal text-muted" aria-hidden="true">
            {hint}
          </span>
        )}
      </label>
      {children({
        id,
        name,
        required,
        className: 'field',
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
