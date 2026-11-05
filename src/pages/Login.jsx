import { useEffect, useId, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import Logo from '../components/Logo'
import { getSession, safeNext, signIn } from '../lib/auth.js'

const params = new URLSearchParams(window.location.search)
const NEXT = safeNext(params.get('next'))
const NOTICE = params.has('expirada')
  ? 'Tu sesión expiró. Ingresa de nuevo para continuar.'
  : params.has('salida')
    ? 'Cerraste sesión correctamente.'
    : ''

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState('checking') // checking | idle | sending
  const [error, setError] = useState('')
  const uid = useId()

  // Si ya hay una sesión activa, no hace falta volver a ingresar.
  useEffect(() => {
    getSession()
      .then((s) => (s ? window.location.replace(NEXT) : setStatus('idle')))
      .catch(() => setStatus('idle'))
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    if (status === 'sending') return
    if (!username.trim() || !password) {
      setError('Escribe tu usuario y tu contraseña.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      await signIn(username, password)
      window.location.replace(NEXT)
    } catch (err) {
      setError(err.message)
      setPassword('')
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <main id="contenido" className="relative grid min-h-dvh overflow-hidden lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <section className="grain relative hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <div aria-hidden="true" className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-violet/40 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
        <a href="/" aria-label="AIDU, volver al inicio" className="relative w-fit">
          <Logo tone="light" label={false} className="h-14 w-auto" />
        </a>
        <div className="relative max-w-md">
          <Logo colorful intro label={false} className="h-48 w-auto" />
          <p className="mt-10 font-display text-4xl font-bold leading-tight">
            Estrategia, marketing y <span className="text-lime">digitalización comercial</span>.
          </p>
          <p className="mt-4 text-paper/70">Espacio reservado para el equipo de AIDU.</p>
        </div>
        <p className="relative text-xs uppercase tracking-[0.28em] text-paper/50">Estrategia · Datos · IA</p>
      </section>

      {/* Formulario */}
      <section className="relative flex flex-col px-4 py-8 sm:px-10">
        <div aria-hidden="true" className="absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet/15 blur-3xl lg:hidden" />
        <div className="relative flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden="true" /> Volver al sitio
          </a>
          <a href="/" aria-label="AIDU, volver al inicio" className="lg:hidden">
            <Logo label={false} className="h-10 w-auto" />
          </a>
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet shadow-sm ring-1 ring-ink/5">
            <LockKeyhole size={14} aria-hidden="true" /> Área privada
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl">Acceso privado</h1>
          <p className="mt-3 text-lg text-muted">Ingresa para consultar nuestros planes comerciales</p>

          {NOTICE && !error && (
            <p className="mt-6 rounded-2xl bg-violet-soft px-4 py-3 text-sm font-medium" role="status">
              {NOTICE}
            </p>
          )}

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-8 space-y-5 rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_-40px_rgb(20_18_24/0.4)] ring-1 ring-ink/5 sm:p-8"
          >
            <div>
              <label htmlFor={`${uid}-user`} className="field-label">
                Usuario
              </label>
              <input
                id={`${uid}-user`}
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="nombre.apellido"
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${uid}-error` : undefined}
                disabled={status === 'checking'}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-pass`} className="field-label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id={`${uid}-pass`}
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="field pr-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${uid}-error` : undefined}
                  disabled={status === 'checking'}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={show}
                >
                  {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p id={`${uid}-error`} role="alert" className="flex items-start gap-2.5 rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium">
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-[#c2341a]" aria-hidden="true" />
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full py-4 text-base" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                  {status === 'checking' ? 'Verificando sesión…' : 'Validando acceso…'}
                </>
              ) : (
                <>
                  Ingresar <ArrowUpRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            ¿No tienes acceso? Este espacio es solo para el equipo. Si eres cliente,{' '}
            <a href="/#contacto" className="font-semibold text-violet hover:underline">
              escríbenos
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
