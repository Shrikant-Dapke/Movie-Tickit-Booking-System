import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarDays, Clapperboard, Plus } from 'lucide-react';
import { moviesApi, screensApi, showsApi, theatresApi } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminPageHeader, AdminTable, RowActions } from '@/pages/Admin/AdminUI';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatLongDate, formatTime12 } from '@/lib/utils';
import type { Show } from '@/types/api';

const showSchema = z.object({
  movie: z.string().min(1, 'Select a movie'),
  theatre: z.string().min(1, 'Select a theatre'),
  screen: z.string().min(1, 'Select a screen'),
  date: z.string().min(1, 'Select a show date'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm format'),
  format: z.string().trim().min(1, 'Format is required'),
  regular: z.coerce.number().positive('Regular price must be positive'),
  premium: z.coerce.number().positive('Premium price must be positive'),
  recliner: z.coerce.number().positive('Recliner price must be positive'),
  status: z.enum(['scheduled', 'cancelled']),
});
type ShowFormValues = z.infer<typeof showSchema>;

export default function AdminShowsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ movie: '', theatre: '', city: '', date: '', format: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Show | null>(null);
  const [deleting, setDeleting] = useState<Show | null>(null);
  const debouncedFilters = useDebounce(filters, 300);

  const showsQuery = useQuery({
    queryKey: ['shows', debouncedFilters],
    queryFn: () =>
      showsApi.list({
        movie: debouncedFilters.movie || undefined,
        theatre: debouncedFilters.theatre || undefined,
        city: debouncedFilters.city || undefined,
        date: debouncedFilters.date || undefined,
        format: debouncedFilters.format || undefined,
      }),
  });

  const moviesQuery = useQuery({ queryKey: ['movies'], queryFn: () => moviesApi.list() });
  const theatresQuery = useQuery({ queryKey: ['theatres'], queryFn: () => theatresApi.list() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['shows'] });
    void queryClient.invalidateQueries({ queryKey: ['seats'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ShowFormValues) => {
      const payload = {
        movie: values.movie,
        theatre: values.theatre,
        screen: values.screen,
        date: values.date,
        time: values.time,
        format: values.format,
        pricing: { Regular: values.regular, Premium: values.premium, Recliner: values.recliner },
        status: values.status,
      };
      return editing ? showsApi.update(editing.id, payload) : showsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Show updated' : 'Show created');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not save show', error instanceof Error ? error.message : 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (show: Show) => showsApi.delete(show.id),
    onSuccess: () => {
      toast.success('Show deleted');
      setDeleting(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not delete show', error instanceof Error ? error.message : 'Please try again.'),
  });

  const updateFilter = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <AdminPageHeader
        title="Shows"
        subtitle="Schedule movies on screens across your theatres"
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add show</Button>}
      />

      <div className="surface mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={filters.movie} onChange={(event) => updateFilter('movie', event.target.value)} aria-label="Filter by movie">
          <option value="">All movies</option>
          {(moviesQuery.data ?? []).map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
        </Select>
        <Select value={filters.theatre} onChange={(event) => updateFilter('theatre', event.target.value)} aria-label="Filter by theatre">
          <option value="">All theatres</option>
          {(theatresQuery.data ?? []).map((theatre) => <option key={theatre.id} value={theatre.id}>{theatre.name}</option>)}
        </Select>
        <Input value={filters.city} onChange={(event) => updateFilter('city', event.target.value)} placeholder="City" aria-label="Filter by city" />
        <Input value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} type="date" aria-label="Filter by date" />
        <Input value={filters.format} onChange={(event) => updateFilter('format', event.target.value)} placeholder="Format (2D, 3D)" aria-label="Filter by format" />
      </div>

      {showsQuery.isLoading ? (
        <TableSkeleton />
      ) : showsQuery.isError ? (
        <ErrorState title="Shows unavailable" message={showsQuery.error instanceof Error ? showsQuery.error.message : undefined} onRetry={() => showsQuery.refetch()} />
      ) : showsQuery.data?.length ? (
        <AdminTable headers={['Movie', 'Theatre / Screen', 'Date & time', 'Format', 'Prices', 'Status', 'Actions']}>
          {showsQuery.data.map((show) => (
            <tr key={show.id}>
              <td className="px-4 py-3 font-semibold text-white">{show.movie?.title ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-300">
                {show.theatre?.name ?? '—'}
                <span className="block text-slate-500">{show.screen?.name ?? '—'} · {show.theatre?.city ?? ''}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-300">
                {formatLongDate(show.date)}
                <span className="block text-slate-500">{formatTime12(show.time)}</span>
              </td>
              <td className="px-4 py-3"><Badge tone="blue">{show.format}</Badge></td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {formatCurrency(show.pricing?.Regular)} / {formatCurrency(show.pricing?.Premium)} / {formatCurrency(show.pricing?.Recliner)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={show.status === 'scheduled' ? 'green' : 'red'}>{show.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => { setEditing(show); setFormOpen(true); }} onDelete={() => setDeleting(show)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="No shows found" description="Create a show or adjust your filters." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Add show</Button>} />
      )}

      <ShowFormModal
        open={formOpen}
        show={editing}
        movies={moviesQuery.data ?? []}
        theatres={theatresQuery.data ?? []}
        saving={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="Delete this show?"
        message="This show and its seat availability will be removed. Existing bookings remain in history."
        confirmLabel="Delete show"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function ShowFormModal({
  open,
  show,
  movies,
  theatres,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  show: Show | null;
  movies: Array<{ id: string; title: string }>;
  theatres: Array<{ id: string; name: string; city: string }>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ShowFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShowFormValues>({
    resolver: zodResolver(showSchema),
    defaultValues: {
      movie: '',
      theatre: '',
      screen: '',
      date: '',
      time: '19:00',
      format: '2D',
      regular: 180,
      premium: 280,
      recliner: 450,
      status: 'scheduled',
    },
  });

  const theatreId = watch('theatre');
  const screensQuery = useQuery({
    queryKey: ['screens-by-theatre', theatreId],
    queryFn: () => screensApi.byTheatre(theatreId),
    enabled: open && !!theatreId,
  });

  useEffect(() => {
    if (!open) return;
    const screenId = show ? (typeof show.screen === 'string' ? show.screen : show.screen?.id) : '';
    reset(
      show
        ? {
            movie: typeof show.movie === 'string' ? show.movie : show.movie?.id ?? '',
            theatre: typeof show.theatre === 'string' ? show.theatre : show.theatre?.id ?? '',
            screen: screenId ?? '',
            date: show.date,
            time: show.time,
            format: show.format,
            regular: show.pricing?.Regular ?? 180,
            premium: show.pricing?.Premium ?? 280,
            recliner: show.pricing?.Recliner ?? 450,
            status: show.status,
          }
        : {
            movie: movies[0]?.id ?? '',
            theatre: theatres[0]?.id ?? '',
            screen: '',
            date: '',
            time: '19:00',
            format: '2D',
            regular: 180,
            premium: 280,
            recliner: 450,
            status: 'scheduled',
          },
    );
  }, [open, show, movies, theatres, reset]);

  useEffect(() => {
    if (!open || show || !screensQuery.data?.length) return;
    setValue('screen', screensQuery.data[0].id, { shouldValidate: true });
  }, [open, show, screensQuery.data, setValue]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={show ? 'Edit show' : 'Create a show'}
      description="Assign a movie to a screen, set the schedule and ticket prices."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>{show ? 'Save changes' : 'Create show'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <Select label="Movie" error={errors.movie?.message} {...register('movie')}>
          {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
        </Select>
        <Select label="Theatre" error={errors.theatre?.message} {...register('theatre')}>
          {theatres.map((theatre) => <option key={theatre.id} value={theatre.id}>{theatre.name} — {theatre.city}</option>)}
        </Select>
        <Select label="Screen" error={errors.screen?.message} disabled={!theatreId} {...register('screen')}>
          <option value="">Select a screen</option>
          {(screensQuery.data ?? []).map((screen) => <option key={screen.id} value={screen.id}>{screen.name} ({screen.format})</option>)}
        </Select>
        <Input label="Format" placeholder="2D / 3D / IMAX" error={errors.format?.message} {...register('format')} />
        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Time (24-hour, HH:mm)" placeholder="19:00" error={errors.time?.message} {...register('time')} />
        <Input label="Regular price (₹)" type="number" error={errors.regular?.message} {...register('regular')} />
        <Input label="Premium price (₹)" type="number" error={errors.premium?.message} {...register('premium')} />
        <Input label="Recliner price (₹)" type="number" error={errors.recliner?.message} {...register('recliner')} />
        <Select label="Status" error={errors.status?.message} {...register('status')}>
          <option value="scheduled">Scheduled</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <p className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2">
          <Clapperboard className="h-4 w-4 text-brand-400" /> Ticket prices are stored per show and used by the seat map.
        </p>
      </form>
    </Modal>
  );
}
