import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Film,
  Play,
  Star,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { moviesApi, showsApi } from '@/api/client';
import { ShowCard } from '@/components/ShowCard';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';
import { formatDate, formatLongDate, getInitials, pluralize, youtubeId } from '@/lib/utils';
import type { Show } from '@/types/api';

export default function MovieDetailsPage() {
  const { id = '' } = useParams();
  const [trailerOpen, setTrailerOpen] = useState(false);

  const movieQuery = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.get(id),
    enabled: !!id,
  });
  const showsQuery = useQuery({
    queryKey: ['shows', { movie: id }],
    queryFn: () => showsApi.list({ movie: id }),
    enabled: !!id,
  });

  const groupedShows = useMemo(() => {
    const groups = new Map<string, Show[]>();
    for (const show of showsQuery.data ?? []) {
      const key = show.date;
      const list = groups.get(key) ?? [];
      list.push(show);
      groups.set(key, list);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, shows]) => ({
        date,
        shows: [...shows].sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [showsQuery.data]);

  if (movieQuery.isLoading) return <PageLoader label="Loading movie…" />;

  if (movieQuery.isError || !movieQuery.data) {
    return (
      <div className="container-cine py-12">
        <ErrorState
          title="Movie not found"
          message={movieQuery.error instanceof Error ? movieQuery.error.message : 'This movie could not be loaded.'}
          onRetry={() => movieQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-semibold text-brand-400 hover:text-brand-300">← Back to movies</Link>
        </div>
      </div>
    );
  }

  const movie = movieQuery.data;
  const videoId = youtubeId(movie.trailerUrl);
  const availableShows = groupedShows.filter((group) => group.shows.some((show) => show.status !== 'cancelled'));

  return (
    <div>
      {/* Backdrop hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0">
          <PosterImage
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            variant="backdrop"
            eager
            className="h-full w-full"
            imgClassName="scale-105"
          />
          <div className="hero-shade absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(229,9,20,0.14),transparent_45%)]" />
        </div>
        <div className="container-cine relative py-10 sm:py-16">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All movies
          </Link>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
            <PosterImage
              src={movie.poster}
              alt={movie.title}
              className="aspect-[2/3] w-40 shrink-0 rounded-xl border border-white/10 shadow-2xl sm:w-52"
            />
            <div className="max-w-3xl animate-fade-up">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge tone={movie.status === 'showing' ? 'green' : 'blue'}>
                  {movie.status === 'showing' ? 'Now showing' : 'Upcoming'}
                </Badge>
                {movie.featured && <Badge tone="purple">Featured</Badge>}
                {movie.trending && <Badge tone="amber">Trending</Badge>}
              </div>
              <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-white sm:text-7xl">
                {movie.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-200">
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" /> {Number(movie.rating).toFixed(1)} / 10
                </span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-slate-400" /> {pluralize(movie.duration, 'min')}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-400" /> {formatDate(movie.releaseDate)}</span>
                <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs">{movie.certificate}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genre.map((item) => (
                  <Badge key={item} tone="neutral">{item}</Badge>
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{movie.description}</p>
              {movie.director && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300">
                  <UserRound className="h-4 w-4 text-brand-400" aria-hidden="true" />
                  <span className="text-slate-500">Directed by</span>
                  <span className="font-semibold text-white">{movie.director}</span>
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {videoId && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.07] px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.14]"
                  >
                    <Play className="h-4 w-4 fill-brand-500 text-brand-500" /> Watch trailer
                  </button>
                )}
                <a
                  href="#showtimes"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-400"
                >
                  <Ticket className="h-4 w-4" /> Find showtimes
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-cine grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <section id="showtimes">
          {movie.synopsis && (
            <div className="surface mb-8 p-5 sm:p-6">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">The story</p>
              <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">Synopsis</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">{movie.synopsis}</p>
            </div>
          )}
          <div className="mb-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Schedule</p>
            <h2 className="font-display text-3xl tracking-wide text-white sm:text-4xl">Choose a showtime</h2>
          </div>

          {showsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="skeleton h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : showsQuery.isError ? (
            <ErrorState
              title="Showtimes unavailable"
              message={showsQuery.error instanceof Error ? showsQuery.error.message : undefined}
              onRetry={() => showsQuery.refetch()}
            />
          ) : availableShows.length ? (
            <div className="space-y-8">
              {availableShows.map((group) => (
                <div key={group.date}>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">{formatLongDate(group.date)}</h3>
                    <span className="h-px flex-1 bg-white/[0.07]" />
                    <span className="text-xs text-slate-500">{pluralize(group.shows.length, 'show')}</span>
                  </div>
                  <div className="space-y-3">
                    {group.shows.map((show) => (
                      <ShowCard key={show.id} show={show} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Film className="h-7 w-7" />}
              title="No showtimes scheduled"
              description="This movie is not currently scheduled. Check back soon!"
            />
          )}
        </section>

        <aside className="space-y-5">
          <div className="surface p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">Movie details</h3>
            {movie.director && <Detail label="Director" value={movie.director} />}
            <Detail label="Language" value={movie.language} />
            <Detail label="Genres" value={movie.genre.join(', ') || '—'} />
            <Detail label="Formats" value={movie.format.join(', ') || '—'} />
            <Detail label="Duration" value={pluralize(movie.duration, 'min')} />
            <Detail label="Certificate" value={movie.certificate} />
            <Detail label="Release" value={formatDate(movie.releaseDate)} />
          </div>
          <div className="surface p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">Cast</h3>
            {movie.cast.length ? (
              <div className="flex flex-wrap gap-2">
                {movie.cast.map((actor) => (
                  <span key={actor} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 py-1 pl-1 pr-3 text-xs text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-300">
                      {getInitials(actor)}
                    </span>
                    {actor}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Cast information unavailable.</p>
            )}
          </div>
        </aside>
      </div>

      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`${movie.title} — Trailer`} size="lg">
        {videoId ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-400">
            <X className="h-8 w-8" />
            <p>No trailer is available for this movie.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.06] py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}
