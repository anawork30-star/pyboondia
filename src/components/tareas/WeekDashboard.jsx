import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ListChecks, Sparkles } from 'lucide-react'
import { STATUSES, addDays, formatDate, startOfWeek, taskId, toISODate, weekStats } from '../../lib/taskLogic.js'
import { COLUMN_STYLE } from './styles.js'
import ClientTag from './ClientTag.jsx'

const card = 'rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_-24px_rgb(20_18_24/0.25)] ring-1 ring-ink/5 sm:p-6'

export default function WeekDashboard({ tasks, clientName, onOpen }) {
  const [offset, setOffset] = useState(0)
  const now = useMemo(() => new Date(), [])
  const s = useMemo(
    () =>
      weekStats(
        tasks.map((t) => ({ ...t, client_name: t.client_id ? clientName(t.client_id) : null })),
        addDays(startOfWeek(now), offset * 7),
        now,
      ),
    [tasks, clientName, offset, now],
  )
  const maxDay = Math.max(1, ...s.byDay.map((d) => d.completed))
  const weekLabel = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana pasada' : offset === 1 ? 'Próxima semana' : 'Semana'
  const todayISO = toISODate(now)

  return (
    <div className="space-y-5">
      {/* Selector de semana */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-violet">{weekLabel}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            {formatDate(s.start)} – {formatDate(s.end)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOffset((o) => o - 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-ink/10 hover:bg-ink/5" aria-label="Semana anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          {offset !== 0 && (
            <button type="button" onClick={() => setOffset(0)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/10 hover:bg-ink/5">
              Hoy
            </button>
          )}
          <button type="button" onClick={() => setOffset((o) => o + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-ink/10 hover:bg-ink/5" aria-label="Semana siguiente">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Avance de la semana */}
      <section className="grain overflow-hidden rounded-[1.75rem] bg-ink p-6 text-paper sm:p-8" aria-labelledby="avance">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h3 id="avance" className="text-sm font-semibold uppercase tracking-[0.16em] text-paper/60">
              Avance de la semana
            </h3>
            <p className="mt-2 font-display text-6xl font-extrabold leading-none tracking-tight sm:text-7xl">
              {s.progress}
              <span className="text-3xl text-lime">%</span>
            </p>
            <p className="mt-2 text-paper/70">
              {s.total ? `${s.done} de ${s.total} compromisos completados` : 'Sin compromisos para esta semana'}
            </p>
          </div>
          {s.stepsTotal > 0 && (
            <p className="text-sm text-paper/70">
              <ListChecks size={16} className="mr-1 inline text-lime" aria-hidden="true" />
              {s.stepsDone}/{s.stepsTotal} pasos completados
            </p>
          )}
        </div>
        {/* Barra por estado: cada segmento lleva su nombre en la leyenda */}
        {s.total > 0 && (
          <>
            <div className="mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full bg-paper/10" role="img" aria-label={STATUSES.map((st) => `${st.label}: ${s.byStatus[st.id]}`).join(', ')}>
              {[...STATUSES].reverse().map(
                (st) =>
                  s.byStatus[st.id] > 0 && (
                    <span key={st.id} className={`${st.id === 'pendiente' ? 'bg-paper/40' : COLUMN_STYLE[st.id].bar} h-full`} style={{ width: `${(s.byStatus[st.id] / s.total) * 100}%` }} title={`${st.label}: ${s.byStatus[st.id]}`} />
                  ),
              )}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-paper/80">
              {[...STATUSES].reverse().map((st) => (
                <li key={st.id} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${st.id === 'pendiente' ? 'bg-paper/40' : COLUMN_STYLE[st.id].bar}`} aria-hidden="true" />
                  {st.label} <strong className="text-paper">{s.byStatus[st.id]}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Indicadores */}
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={CheckCircle2} label="Completadas" value={s.completed.length} />
        <Stat icon={CircleDot} label="En progreso" value={s.byStatus.en_progreso} />
        <Stat icon={Sparkles} label="Nuevas" value={s.created.length} />
        <Stat icon={AlertTriangle} label="Vencidas" value={s.overdue.length} alert={s.overdue.length > 0} />
      </dl>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Completadas por día */}
        <section className={card} aria-labelledby="por-dia">
          <h3 id="por-dia" className="text-lg font-bold">
            Tareas completadas por día
          </h3>
          <div className="mt-6 flex h-40 items-end gap-2" aria-hidden="true">
            {s.byDay.map((d) => (
              <div key={d.iso} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100">
                  {d.completed} completada{d.completed === 1 ? '' : 's'} · {d.created} nueva{d.created === 1 ? '' : 's'}
                </span>
                {d.completed > 0 && <span className="mb-1 text-xs font-semibold text-muted">{d.completed}</span>}
                <span
                  className={`w-full max-w-10 rounded-t-[4px] ${d.completed ? 'bg-violet' : 'bg-ink/10'}`}
                  style={{ height: d.completed ? `${(d.completed / maxDay) * 85}%` : '2px' }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 border-t border-ink/10 pt-2" aria-hidden="true">
            {s.byDay.map((d) => (
              <span key={d.iso} className={`flex-1 text-center text-xs ${d.iso === todayISO ? 'font-bold text-violet' : 'text-muted'}`}>
                {d.label}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Tareas completadas y creadas por día</caption>
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Completadas</th>
                <th scope="col">Nuevas</th>
              </tr>
            </thead>
            <tbody>
              {s.byDay.map((d) => (
                <tr key={d.iso}>
                  <th scope="row">{formatDate(d.iso, { weekday: true })}</th>
                  <td>{d.completed}</td>
                  <td>{d.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Avance por cliente */}
        <section className={card} aria-labelledby="por-cliente">
          <h3 id="por-cliente" className="text-lg font-bold">
            Avance por cliente
          </h3>
          {s.byClient.length ? (
            <ul className="mt-5 space-y-4">
              {s.byClient.map((g) => (
                <li key={g.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    {g.key === 'propias' ? <span className="font-semibold">{g.name}</span> : <ClientTag name={g.name} />}
                    <span className="text-muted">
                      {g.done}/{g.total} · {Math.round((g.done / g.total) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-violet" style={{ width: `${(g.done / g.total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Sin tareas en esta semana.</p>
          )}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TaskList
          title="Pendientes de la semana"
          empty="Nada pendiente. ¡Buen trabajo!"
          tasks={[...s.open].sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.number - b.number)}
          clientName={clientName}
          onOpen={onOpen}
          todayISO={todayISO}
        />
        <TaskList
          title="Completadas en la semana"
          empty="Aún no hay tareas completadas esta semana."
          tasks={[...s.completed].sort((a, b) => b.completed_at.localeCompare(a.completed_at))}
          clientName={clientName}
          onOpen={onOpen}
          todayISO={todayISO}
          done
        />
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, alert }) {
  return (
    <div className={`${card} !p-5`}>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon size={15} className={alert ? 'text-[#c2341a]' : 'text-violet'} aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-2 font-display text-4xl font-bold">{value}</dd>
    </div>
  )
}

function TaskList({ title, empty, tasks, clientName, onOpen, todayISO, done }) {
  return (
    <section className={card}>
      <h3 className="text-lg font-bold">
        {title} <span className="text-muted">({tasks.length})</span>
      </h3>
      {tasks.length ? (
        <ul className="mt-4 divide-y divide-ink/5">
          {tasks.map((t) => {
            const overdue = !done && t.due_date && t.due_date < todayISO
            return (
              <li key={t.id}>
                <button type="button" onClick={() => onOpen(t.id)} className="flex w-full items-start gap-3 py-3 text-left hover:bg-paper/60">
                  <span className="mt-0.5 font-mono text-xs font-semibold text-violet">{taskId(t.number)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">{t.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <ClientTag name={t.client_id ? clientName(t.client_id) : null} size="xs" />
                      {done && t.completed_at && formatDate(new Date(t.completed_at), { weekday: true })}
                    </span>
                  </span>
                  {!done && t.due_date && (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${overdue ? 'bg-coral-soft text-[#a52a12]' : 'bg-ink/5 text-muted'}`}>
                      <CalendarDays size={12} aria-hidden="true" /> {formatDate(t.due_date)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      )}
    </section>
  )
}
