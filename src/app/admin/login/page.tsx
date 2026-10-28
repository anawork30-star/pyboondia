import { signIn } from './actions';
import { input, label, btn } from '../ui';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-azul to-sky-300 p-6">
      <form action={signIn} className="w-full max-w-sm space-y-4 rounded-3xl bg-crema p-8 shadow-xl">
        <h1 className="font-titulo text-3xl font-bold text-azul-oscuro">Panel administrativo</h1>
        <p className="text-sm">Ingresa con tu cuenta de administradora.</p>
        {error && <p role="alert" className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">Correo o contraseña incorrectos.</p>}
        <div><label className={label} htmlFor="email">Correo</label><input className={input} id="email" name="email" type="email" required autoComplete="username" /></div>
        <div><label className={label} htmlFor="password">Contraseña</label><input className={input} id="password" name="password" type="password" required autoComplete="current-password" /></div>
        <button className={`${btn} w-full`}>Entrar</button>
      </form>
    </main>
  );
}
