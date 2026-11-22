import { Link } from 'react-router-dom';
import { CalendarDays, Clapperboard, Star, Ticket } from 'lucide-react';
import type { Movie } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { PosterImage } from '@/components/PosterImage';
import { formatDate, pluralize } from '@/lib/utils';

export function MovieCard({ movie }: { movie: Movie }) {
  const showing = movie.status === 'showing';

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850 surface-hover"
      aria-label={`View details for ${movie.title}`}
    >
      <PosterImage
        src={movie.poster}
        alt={movie.title}
        className="aspect-[2/3] w-full"
        imgClassName="group-hover:scale-110"
      />
      <div className="poster-shade pointer-events-none absolute inset-0" />

      <div className="absolute left-3 top-3 flex flex-col gap-1.5">
        {movie.trending && <Badge tone="red">Trending</Badge>}
        {movie.featured && <Badge tone="purple">Featured</Badge>}
      </div>

      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-amber-400 backdrop-blur">
        <Star className="h-3.5 w-3.5 fill-amber-400" />
        {Number(movie.rating).toFixed(1)}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="line-clamp-2 font-display text-2xl leading-tight tracking-wide text-white transition-colors group-hover:text-brand-300">
          {movie.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-300">
          <span>{movie.language}</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>{pluralize(movie.duration, 'min')}</span>
        </div>
        <div className="mt-3 flex max-h-0 items-center justify-between overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-12 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
            <Ticket className="h-4 w-4 text-brand-500" /> {showing ? 'Book tickets' : 'View details'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(movie.releaseDate, { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-500 p-3 text-white shadow-lg group-hover:block" aria-hidden="true">
        <Clapperboard className="h-5 w-5" />
      </div>
    </Link>
  );
}
