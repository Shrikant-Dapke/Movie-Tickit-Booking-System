import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, MonitorPlay } from 'lucide-react';
import type { Show } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { BadgeCheck } from 'lucide-react';
import { cn, formatCurrency, formatTime12 } from '@/lib/utils';

export function ShowCard({ show }: { show: Show }) {
  const cancelled = show.status === 'cancelled';
  const prices = show.pricing ? Object.values(show.pricing).filter((n) => Number(n) > 0) : [];
  const fromPrice = prices.length ? Math.min(...prices) : 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-ink-900/70 p-4 transition-colors hover:border-brand-500/40 sm:flex-row sm:items-center sm:justify-between',
        cancelled && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-white">{formatTime12(show.time)}</p>
            <Badge tone="blue">{show.format}</Badge>
            {cancelled && <Badge tone="red">Cancelled</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {show.theatre?.name ?? 'Theatre'}
              {show.theatre?.city ? `, ${show.theatre.city}` : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <MonitorPlay className="h-3.5 w-3.5" /> {show.screen?.name ?? 'Screen'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Starts from</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(fromPrice)}</p>
        </div>
        {cancelled ? (
          <span className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-500">
            Unavailable
          </span>
        ) : (
          <Link
            to={`/shows/${show.id}/seats`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            <BadgeCheck className="h-4 w-4" /> Seats <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
