import { NavLink, Outlet } from 'react-router-dom';
import {
  Clapperboard,
  Film,
  LayoutDashboard,
  MonitorPlay,
  ShieldCheck,
  Ticket,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/movies', label: 'Movies', icon: Film, end: false },
  { to: '/admin/theatres', label: 'Theatres', icon: Building2, end: false },
  { to: '/admin/screens', label: 'Screens', icon: MonitorPlay, end: false },
  { to: '/admin/shows', label: 'Shows', icon: Clapperboard, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket, end: false },
];

export function AdminLayout() {
  return (
    <div className="container-cine py-8 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            <ShieldCheck className="h-4 w-4" /> Protected area
          </p>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">ADMIN CONTROL ROOM</h1>
          <p className="mt-2 text-sm text-slate-400">Manage the catalogue, schedule and every booking.</p>
        </div>
        <a
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-slate-300 transition hover:border-brand-500/40 hover:text-white"
        >
          View site <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <nav className="scrollbar-thin mb-7 flex gap-1.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-900/70 p-1.5" aria-label="Admin navigation">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4" /> {item.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
