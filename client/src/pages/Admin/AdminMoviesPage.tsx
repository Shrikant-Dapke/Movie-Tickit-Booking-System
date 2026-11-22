import { useEffect, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Film, Loader2, Plus, UploadCloud } from 'lucide-react';
import { adminApi, moviesApi } from '@/api/client';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminPageHeader, AdminSearch, AdminTable, RowActions } from '@/pages/Admin/AdminUI';
import { parseCsv, toCsv } from '@/lib/utils';
import type { Movie } from '@/types/api';

const movieSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  genre: z.string().trim().min(1, 'Add at least one genre'),
  language: z.string().trim().min(1, 'Language is required'),
  format: z.string().trim().min(1, 'Add at least one format (e.g. 2D, 3D)'),
  duration: z.coerce.number().int().positive('Duration must be a positive number'),
  releaseDate: z.string().min(1, 'Release date is required'),
  certificate: z.string().trim().min(1, 'Certificate is required'),
  rating: z.coerce.number().min(0, 'Rating cannot be negative').max(10, 'Rating cannot exceed 10'),
  cast: z.string().optional(),
  // Uploaded posters are relative /uploads/... paths; manual http(s) URLs still work.
  poster: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^https?:\/\//i.test(value) || /^\/uploads\/[^\s]+$/i.test(value),
      'Enter a valid URL or upload a poster',
    ),
  backdrop: z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), 'Enter a valid URL'),
  trailerUrl: z.string().optional(),
  status: z.enum(['showing', 'upcoming']),
  featured: z.boolean(),
  trending: z.boolean(),
});

type MovieFormValues = z.infer<typeof movieSchema>;

const POSTER_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const POSTER_MAX_BYTES = 5 * 1024 * 1024;

export default function AdminMoviesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [deleting, setDeleting] = useState<Movie | null>(null);

  const moviesQuery = useQuery({
    queryKey: ['movies', { search: search || undefined }],
    queryFn: () => moviesApi.list(search ? { search } : undefined),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['movies'] });
    void queryClient.invalidateQueries({ queryKey: ['movie'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: MovieFormValues) => {
      const payload: Partial<Movie> = {
        title: values.title,
        description: values.description,
        genre: parseCsv(values.genre),
        language: values.language,
        format: parseCsv(values.format),
        duration: values.duration,
        releaseDate: values.releaseDate,
        certificate: values.certificate,
        rating: values.rating,
        cast: parseCsv(values.cast),
        poster: values.poster,
        backdrop: values.backdrop,
        trailerUrl: values.trailerUrl ?? '',
        status: values.status,
        featured: values.featured,
        trending: values.trending,
      };
      return editing ? moviesApi.update(editing.id, payload) : moviesApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Movie updated' : 'Movie created', 'The catalogue has been refreshed.');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not save movie', error instanceof Error ? error.message : 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (movie: Movie) => moviesApi.delete(movie.id),
    onSuccess: () => {
      toast.success('Movie deleted', 'The movie has been removed from the catalogue.');
      setDeleting(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not delete movie', error instanceof Error ? error.message : 'Please try again.'),
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (movie: Movie) => {
    setEditing(movie);
    setFormOpen(true);
  };

  return (
    <div>
      <AdminPageHeader
        title="Movies"
        subtitle={`${moviesQuery.data?.length ?? 0} movies in the catalogue`}
        action={<Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add movie</Button>}
      />

      <div className="mb-5">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search movies by title…" />
      </div>

      {moviesQuery.isLoading ? (
        <TableSkeleton />
      ) : moviesQuery.isError ? (
        <ErrorState title="Movies unavailable" message={moviesQuery.error instanceof Error ? moviesQuery.error.message : undefined} onRetry={() => moviesQuery.refetch()} />
      ) : moviesQuery.data?.length ? (
        <AdminTable headers={['Movie', 'Details', 'Status', 'Flags', 'Actions']}>
          {moviesQuery.data.map((movie) => (
            <tr key={movie.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <PosterImage src={movie.poster} alt={movie.title} className="h-14 w-10 shrink-0 rounded-md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{movie.title}</p>
                    <p className="text-xs text-slate-500">{movie.language} · {movie.duration} min</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                <p>{movie.genre.join(', ') || '—'}</p>
                <p className="mt-1">{movie.format.join(', ') || '—'}</p>
              </td>
              <td className="px-4 py-3">
                <Badge tone={movie.status === 'showing' ? 'green' : 'blue'}>{movie.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {movie.featured && <Badge tone="purple">Featured</Badge>}
                  {movie.trending && <Badge tone="amber">Trending</Badge>}
                </div>
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(movie)} onDelete={() => setDeleting(movie)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <EmptyState icon={<Film className="h-7 w-7" />} title="No movies found" description="Add a movie or change your search." action={<Button onClick={openCreate}>Add movie</Button>} />
      )}

      <MovieFormModal
        open={formOpen}
        movie={editing}
        saving={saveMutation.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="Delete this movie?"
        message={`“${deleting?.title ?? ''}” will be removed from the catalogue. Shows linked to it may be affected.`}
        confirmLabel="Delete movie"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function MovieFormModal({
  open,
  movie,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  movie: Movie | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: MovieFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      description: '',
      genre: '',
      language: '',
      format: '2D',
      duration: 120,
      releaseDate: '',
      certificate: 'UA',
      rating: 7,
      cast: '',
      poster: '',
      backdrop: '',
      trailerUrl: '',
      status: 'showing',
      featured: false,
      trending: false,
    },
  });

  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const posterValue = watch('poster');

  const handlePosterUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    event.target.value = '';
    if (!file) return;

    setUploadError(null);
    if (!POSTER_TYPES.includes(file.type)) {
      const message = 'Only JPEG, PNG, WebP or GIF images are allowed.';
      setUploadError(message);
      toast.error('Invalid poster file', message);
      return;
    }
    if (file.size > POSTER_MAX_BYTES) {
      const message = 'Poster image must be 5 MB or smaller.';
      setUploadError(message);
      toast.error('Poster too large', message);
      return;
    }

    setUploading(true);
    try {
      const result = await adminApi.uploadPoster(file);
      setValue('poster', result.url, { shouldValidate: true, shouldDirty: true });
      toast.success('Poster uploaded', `Using ${result.originalName} for this movie.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The upload failed. Please try again.';
      setUploadError(message);
      toast.error('Poster upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setUploadError(null);
    setUploading(false);
    reset(
      movie
        ? {
            title: movie.title,
            description: movie.description,
            genre: toCsv(movie.genre),
            language: movie.language,
            format: toCsv(movie.format),
            duration: movie.duration,
            releaseDate: movie.releaseDate,
            certificate: movie.certificate,
            rating: movie.rating,
            cast: toCsv(movie.cast),
            poster: movie.poster,
            backdrop: movie.backdrop,
            trailerUrl: movie.trailerUrl,
            status: movie.status,
            featured: movie.featured,
            trending: movie.trending,
          }
        : {
            title: '',
            description: '',
            genre: '',
            language: '',
            format: '2D',
            duration: 120,
            releaseDate: '',
            certificate: 'UA',
            rating: 7,
            cast: '',
            poster: '',
            backdrop: '',
            trailerUrl: '',
            status: 'showing',
            featured: false,
            trending: false,
          },
    );
  }, [open, movie, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={movie ? 'Edit movie' : 'Add a movie'}
      description="Use comma-separated values for genres, formats and cast."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>{movie ? 'Save changes' : 'Create movie'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" error={errors.title?.message} {...register('title')} className="sm:col-span-2" />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} className="sm:col-span-2" />
        <Input label="Genres (comma separated)" placeholder="Action, Thriller" error={errors.genre?.message} {...register('genre')} />
        <Input label="Language" placeholder="English" error={errors.language?.message} {...register('language')} />
        <Input label="Formats (comma separated)" placeholder="2D, 3D" error={errors.format?.message} {...register('format')} />
        <Input label="Cast (comma separated)" error={errors.cast?.message} {...register('cast')} />
        <Input label="Duration (minutes)" type="number" error={errors.duration?.message} {...register('duration')} />
        <Input label="Release date" type="date" error={errors.releaseDate?.message} {...register('releaseDate')} />
        <Input label="Certificate" placeholder="UA" error={errors.certificate?.message} {...register('certificate')} />
        <Input label="Rating (0–10)" type="number" step="0.1" error={errors.rating?.message} {...register('rating')} />
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4 sm:col-span-2">
          <label htmlFor="poster-upload" className="field-label flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-brand-400" /> Upload poster (optional)
          </label>
          <input
            id="poster-upload"
            type="file"
            accept={POSTER_ACCEPT}
            onChange={handlePosterUpload}
            disabled={uploading}
            className="block w-full text-xs text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white transition hover:file:bg-brand-400 disabled:opacity-50"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            JPEG, PNG, WebP or GIF · maximum 5 MB. The uploaded image is applied automatically below; you can still paste a poster URL manually instead.
          </p>
          {uploading && (
            <p className="mt-2 flex items-center gap-2 text-xs text-brand-300" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading poster…
            </p>
          )}
          {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
          {posterValue && (
            <p className="mt-2 break-all text-xs text-emerald-400">Poster: {posterValue}</p>
          )}
        </div>
        <Input label="Poster URL" placeholder="https://… or /uploads/…" error={errors.poster?.message} {...register('poster')} className="sm:col-span-2" />
        <Input label="Backdrop URL" placeholder="https://…" error={errors.backdrop?.message} {...register('backdrop')} className="sm:col-span-2" />
        <Input label="Trailer URL / YouTube ID" error={errors.trailerUrl?.message} {...register('trailerUrl')} className="sm:col-span-2" />
        <Select label="Status" error={errors.status?.message} {...register('status')}>
          <option value="showing">Showing</option>
          <option value="upcoming">Upcoming</option>
        </Select>
        <div className="flex items-end gap-5 pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register('featured')} className="h-4 w-4 accent-brand-500" /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register('trending')} className="h-4 w-4 accent-brand-500" /> Trending
          </label>
        </div>
      </form>
    </Modal>
  );
}
