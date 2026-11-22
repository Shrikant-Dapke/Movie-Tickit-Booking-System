import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Clapperboard, Film, Search, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import { moviesApi } from '@/api/client';
import { MovieCard } from '@/components/MovieCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Select } from '@/components/ui/Select';
import { MovieGridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { PosterImage } from '@/components/PosterImage';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, pluralize } from '@/lib/utils';
import type { Movie } from '@/types/api';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [format, setFormat] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      genre: genre || undefined,
      language: language || undefined,
      format: format || undefined,
    }),
    [debouncedSearch, genre, language, format],
  );
  const hasFilters = !!(debouncedSearch || genre || language || format);

  const moviesQuery = useQuery({
    queryKey: ['movies', filters],
    queryFn: () => moviesApi.list(filters),
  });

  const facetsQuery = useQuery({
    queryKey: ['movies', 'facets'],
    queryFn: () => moviesApi.list(),
    staleTime: 10 * 60 * 1000,
  });

  const movies = moviesQuery.data ?? [];
  const allMovies = facetsQuery.data ?? movies;
  const showing = movies.filter((movie) => movie.status === 'showing');
  const upcoming = movies.filter((movie) => movie.status === 'upcoming');
  const featured = movies.filter((movie) => movie.featured);
  const trending = movies.filter((movie) => movie.trending && !movie.featured);
  const hero = featured[0] ?? movies[0] ?? allMovies.find((movie) => movie.featured);

  const genreOptions = useMemo(() => uniqueOptions(allMovies.flatMap((movie) => movie.genre)), [allMovies]);
  const languageOptions = useMemo(() => uniqueOptions(allMovies.map((movie) => movie.language)), [allMovies]);
  const formatOptions = useMemo(() => uniqueOptions(allMovies.flatMap((movie) => movie.format)), [allMovies]);

  const clearFilters = () => {
    setSearch('');
    setGenre('');
    setLanguage('');
    setFormat('');
  };

  return (
    <div>
      {/* Cinematic hero */}
      {!hasFilters && moviesQuery.isLoading ? (
        <div className="container-cine pt-8">
          <Skeleton className="h-[420px] w-full rounded-3xl sm:h-[480px]" />
        </div>
      ) : hero && !hasFilters ? (
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0">
            <PosterImage
              src={hero.backdrop || hero.poster}
              alt={hero.title}
              className="h-full w-full"
              imgClassName="scale-105 object-cover object-center"
            />
            <div className="hero-shade absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
          </div>
          <div className="container-cine relative flex min-h-[440px] flex-col justify-end py-14 sm:min-h-[520px] sm:py-20">
            <div className="max-w-2xl animate-fade-up">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone="red" icon={<Sparkles className="h-3 w-3" />}>
                  {hero.featured ? 'Featured premiere' : 'Now showing'}
                </Badge>
                {hero.trending && <Badge tone="amber">Trending</Badge>}
              </div>
              <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-white drop-shadow-2xl sm:text-7xl lg:text-8xl">
                {hero.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-200">
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" /> {Number(hero.rating).toFixed(1)} / 10
                </span>
                <span>{hero.language}</span>
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                <span>{pluralize(hero.duration, 'min')}</span>
                <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs">{hero.certificate}</span>
              </div>
              <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {hero.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/movies/${hero.id}`}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white shadow-[0_12px_35px_-12px_rgba(229,9,20,1)] transition hover:bg-brand-400"
                >
                  Book tickets <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#now-showing"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.12]"
                >
                  Explore movies
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Search & filters */}
      <section className="container-cine relative z-10 -mt-2 py-8 sm:py-10" id="movies">
        <div className="surface p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search movies by title…"
                aria-label="Search movies"
                className="field-base h-11 pl-10"
              />
            </div>
            <Select value={genre} onChange={(event) => setGenre(event.target.value)} aria-label="Filter by genre">
              <option value="">All genres</option>
              {genreOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            <Select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Filter by language">
              <option value="">All languages</option>
              {languageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            <Select value={format} onChange={(event) => setFormat(event.target.value)} aria-label="Filter by format">
              <option value="">All formats</option>
              {formatOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            <Button
              variant={hasFilters ? 'danger' : 'outline'}
              onClick={clearFilters}
              disabled={!hasFilters}
              leftIcon={<X className="h-4 w-4" />}
              className="whitespace-nowrap"
            >
              Clear
            </Button>
          </div>
          {hasFilters && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand-400" />
              Showing results for your filters
            </p>
          )}
        </div>
      </section>

      {moviesQuery.isError ? (
        <div className="container-cine">
          <ErrorState
            title="Movies unavailable"
            message={moviesQuery.error instanceof Error ? moviesQuery.error.message : undefined}
            onRetry={() => moviesQuery.refetch()}
          />
        </div>
      ) : hasFilters ? (
        <section className="container-cine pb-8">
          <SectionHeading eyebrow="Discover" title="Search results" subtitle={`${movies.length} movie${movies.length === 1 ? '' : 's'} found`} />
          {moviesQuery.isLoading ? (
            <MovieGridSkeleton />
          ) : movies.length ? (
            <MovieGrid movies={movies} />
          ) : (
            <EmptyState
              icon={<Film className="h-7 w-7" />}
              title="No movies matched your filters"
              description="Try a different title, genre, language or format."
              action={<Button onClick={clearFilters} variant="outline">Reset filters</Button>}
            />
          )}
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="container-cine pb-12">
              <SectionHeading eyebrow="Handpicked for you" title="Featured films" subtitle="Stories worth leaving the house for" />
              <Rail movies={featured} />
            </section>
          )}

          <section className="container-cine pb-12" id="now-showing">
            <SectionHeading eyebrow="On the big screen" title="Now showing" subtitle="Grab your seats before they're gone" actionLabel="Browse all" actionTo="#movies" />
            {moviesQuery.isLoading ? (
              <MovieGridSkeleton />
            ) : showing.length ? (
              <MovieGrid movies={showing} />
            ) : (
              <EmptyState title="No movies are showing right now" description="Check back soon or explore our upcoming releases." />
            )}
          </section>

          {trending.length > 0 && (
            <section className="container-cine pb-12">
              <SectionHeading eyebrow="Crowd favourites" title="Trending now" />
              <Rail movies={trending} />
            </section>
          )}

          <section className="container-cine pb-12">
            <SectionHeading eyebrow="Coming soon" title="Upcoming" subtitle="Be the first to book when tickets open" />
            {moviesQuery.isLoading ? (
              <MovieGridSkeleton count={4} />
            ) : upcoming.length ? (
              <MovieGrid movies={upcoming} />
            ) : (
              <EmptyState icon={<Clapperboard className="h-7 w-7" />} title="No upcoming movies yet" description="New releases are added regularly." />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}

function Rail({ movies }: { movies: Movie[] }) {
  return (
    <div className="scrollbar-thin -mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
      {movies.map((movie, index) => (
        <Link
          key={movie.id}
          to={`/movies/${movie.id}`}
          className="group relative h-[240px] w-[380px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] transition-all duration-300 hover:border-brand-500/40 sm:h-[270px] sm:w-[480px]"
        >
          <PosterImage
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="absolute inset-0 h-full w-full"
            imgClassName="group-hover:scale-105"
          />
          <div className="poster-shade absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="font-display text-2xl tracking-wide text-brand-500">{String(index + 1).padStart(2, '0')}</span>
              <Badge tone="neutral">{movie.format[0] ?? '2D'}</Badge>
            </div>
            <h3 className="font-display text-3xl leading-none tracking-wide text-white">{movie.title}</h3>
            <p className="mt-2 line-clamp-2 text-xs text-slate-300">{movie.description}</p>
            <p className="mt-2 text-[11px] font-medium text-brand-300">
              {formatDate(movie.releaseDate)} · {movie.language}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function uniqueOptions(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b));
}
