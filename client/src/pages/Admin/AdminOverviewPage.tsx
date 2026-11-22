import { useQuery } from '@tanstack/react-query';
import { Clapperboard, Film, IndianRupee, MonitorPlay, Star, Ticket, Users, Building2 } from 'lucide-react';
import { adminApi, moviesApi } from '@/api/client';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricSkeleton, StatusBadge } from '@/pages/Admin/AdminUI';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/utils';

export default function AdminOverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.overview,
  });

  // Read-only catalogue query for the Top movies panel.
  const moviesQuery = useQuery({
    queryKey: ['movies'],
    queryFn: () => moviesApi.list(),
  });

  if (overviewQuery.isLoading) return <MetricSkeleton />;

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        title="Overview unavailable"
        message={overviewQuery.error instanceof Error ? overviewQuery.error.message : undefined}
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const data = overviewQuery.data;
  const topMovies = [...(moviesQuery.data ?? [])]
    .sort((a, b) => (b.popularity ?? b.rating) - (a.popularity ?? a.rating))
    .slice(0, 5);
  const metrics = [
    { label: 'Customers', value: data.customers, icon: Users, tone: 'text-sky-400' },
    { label: 'Movies', value: data.movies, icon: Film, tone: 'text-brand-400' },
    { label: 'Theatres', value: data.theatres, icon: Building2, tone: 'text-violet-400' },
    { label: 'Shows', value: data.shows, icon: Clapperboard, tone: 'text-amber-400' },
    { label: 'Bookings', value: data.bookings, icon: Ticket, tone: 'text-emerald-400' },
    { label: 'Revenue', value: formatCurrency(data.revenue), icon: IndianRupee, tone: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="surface-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-2 font-display text-4xl tracking-wide text-white">{metric.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ${metric.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card padded={false}>
          <div className="border-b border-white/[0.07] p-5">
            <h3 className="text-lg font-bold text-white">Recent bookings</h3>
            <p className="mt-1 text-sm text-slate-400">The latest reservations across all theatres</p>
          </div>
          <div className="p-5">
            {data.recentBookings?.length ? (
              <div className="space-y-2">
                {data.recentBookings.slice(0, 8).map((booking) => {
                  const customer =
                    typeof booking.user === 'object' && booking.user ? booking.user.name : 'Customer';
                  return (
                    <div
                      key={booking.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-ink-900/50 p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-300">
                          {getInitials(customer)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                            {booking.code}
                            {booking.seeded && <Badge tone="amber" className="px-1.5 py-0 text-[9px]">Demo record</Badge>}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {customer} · {booking.show?.movie?.title ?? 'Movie'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-emerald-400">{formatCurrency(booking.total)}</span>
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No bookings yet" description="Bookings will appear here as customers reserve seats." />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-lg font-bold text-white">Booking statistics</h3>
            {data.byStatus && Object.keys(data.byStatus).length ? (
              <div className="space-y-3">
                {Object.entries(data.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-900/50 px-3.5 py-3">
                    <StatusBadge status={status} />
                    <span className="font-display text-2xl tracking-wide text-white">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No statistics available yet.</p>
            )}

            <div className="mt-6 border-t border-white/[0.07] pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded revenue</p>
              <p className="mt-2 font-display text-3xl tracking-wide text-emerald-400">{formatCurrency(data.revenue)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <MonitorPlay className="h-3.5 w-3.5" /> Updated {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Top movies</h3>
              <Film className="h-4 w-4 text-brand-400" aria-hidden="true" />
            </div>
            {moviesQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Skeleton className="h-14 w-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : moviesQuery.isError ? (
              <p className="text-sm text-slate-500">Could not load the catalogue.</p>
            ) : topMovies.length ? (
              <div className="space-y-2">
                {topMovies.map((movie, index) => (
                  <div key={movie.id} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-ink-900/50 p-2">
                    <span className="w-3 shrink-0 text-center text-[11px] font-bold text-slate-600">{index + 1}</span>
                    <PosterImage src={movie.poster} alt={movie.title} className="aspect-[2/3] w-9 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white" title={movie.title}>{movie.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" /> {Number(movie.rating).toFixed(1)}
                        <span className="text-slate-600">·</span>
                        <span className="truncate text-slate-500">{movie.genre[0] ?? movie.language}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No movies in the catalogue yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
