import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clapperboard, ShieldCheck, Sparkles, Ticket } from 'lucide-react';
import { Logo } from '@/layouts/AppLayout';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col px-5 py-6 sm:px-10 lg:w-[54%] xl:w-1/2">
        <div className="flex items-center justify-between">
          <Logo compact />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>

        <p className="text-center text-xs text-slate-600 lg:text-left">
          Payments are simulated for demonstration. No real money is charged.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-900 lg:block lg:w-[46%] xl:w-1/2">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/20" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-2xl">
            <Clapperboard className="h-7 w-7" />
          </div>
          <h2 className="font-display text-5xl leading-[1.05] tracking-wide text-white xl:text-6xl">
            THE BIG SCREEN
            <br />
            <span className="text-brand-500">IS CALLING.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
            From the first trailer to the final credits — CineBook makes every movie night effortless.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Feature icon={<Ticket className="h-5 w-5" />} label="Pick your seats" />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} label="Instant booking" />
            <Feature icon={<Sparkles className="h-5 w-5" />} label="Digital tickets" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200 backdrop-blur">
      <span className="text-brand-400">{icon}</span>
      {label}
    </div>
  );
}
