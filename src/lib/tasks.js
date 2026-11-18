// Acceso a datos del tablero de tareas (Supabase). La seguridad vive en RLS
// (migración 0007_tareas.sql): cada persona solo lee y escribe sus propias tareas y clientes.
import { getSupabase } from './supabase.js'

const TASK_FIELDS = 'id, number, title, status, priority, client_id, due_date, steps, observations, started_at, completed_at, created_at, updated_at'

async function db() {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('El tablero no está disponible en este momento.')
  return supabase
}

function fail(error) {
  if (error.code === 'PGRST301' || error.status === 401) throw Object.assign(new Error('expired'), { code: 'EXPIRED' })
  if (error.code === '23505') throw new Error('Ya existe un cliente con ese nombre.')
  throw new Error('No pudimos guardar el cambio. Revisa tu conexión e inténtalo de nuevo.')
}

export async function isPortalMember() {
  const supabase = await db()
  const { data, error } = await supabase.rpc('is_portal_member')
  if (error) fail(error)
  return Boolean(data)
}

export async function loadBoard() {
  const supabase = await db()
  const [tasks, clients] = await Promise.all([
    supabase.from('tasks').select(TASK_FIELDS).order('number', { ascending: true }),
    supabase.from('task_clients').select('id, name').order('name', { ascending: true }),
  ])
  if (tasks.error) fail(tasks.error)
  if (clients.error) fail(clients.error)
  return { tasks: tasks.data ?? [], clients: clients.data ?? [] }
}

export async function loadHistory(taskId) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('task_events')
    .select('from_status, to_status, at')
    .eq('task_id', taskId)
    .order('at', { ascending: true })
  if (error) fail(error)
  return data ?? []
}

export async function createTask(fields) {
  const supabase = await db()
  const { data, error } = await supabase.from('tasks').insert(fields).select(TASK_FIELDS).single()
  if (error) fail(error)
  return data
}

export async function updateTask(id, patch) {
  const supabase = await db()
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select(TASK_FIELDS).single()
  if (error) fail(error)
  return data
}

export async function deleteTask(id) {
  const supabase = await db()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) fail(error)
}

export async function createClient(name) {
  const supabase = await db()
  const { data, error } = await supabase.from('task_clients').insert({ name: name.trim() }).select('id, name').single()
  if (error) fail(error)
  return data
}

export async function renameClient(id, name) {
  const supabase = await db()
  const { data, error } = await supabase.from('task_clients').update({ name: name.trim() }).eq('id', id).select('id, name').single()
  if (error) fail(error)
  return data
}

export async function deleteClient(id) {
  const supabase = await db()
  const { error } = await supabase.from('task_clients').delete().eq('id', id)
  if (error) fail(error)
}
