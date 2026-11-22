import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { MonitorPlay, Plus, Trash2 } from 'lucide-react';
import { screensApi, theatresApi } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminPageHeader, AdminTable, RowActions } from '@/pages/Admin/AdminUI';
import { formatCurrency } from '@/lib/utils';
import type { Screen, Theatre } from '@/types/api';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  startRow: z.coerce.number().int().min(0, 'Must be 0 or more'),
  endRow: z.coerce.number().int().min(0, 'Must be 0 or more'),
  basePrice: z.coerce.number().positive('Price must be positive'),
  color: z.string().optional(),
});

const screenSchema = z.object({
  theatreId: z.string().min(1, 'Select a theatre'),
  name: z.string().trim().min(1, 'Screen name is required'),
  format: z.string().trim().min(1, 'Format is required'),
  rows: z.coerce.number().int().positive('Rows must be positive'),
  seatsPerRow: z.coerce.number().int().positive('Seats per row must be positive'),
  categories: z.array(categorySchema).min(1, 'Add at least one seat category'),
});

type ScreenFormValues = z.infer<typeof screenSchema>;
type ScreenRow = Screen & { theatreName: string; theatreId: string };

export default function AdminScreensPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScreenRow | null>(null);
  const [deleting, setDeleting] = useState<ScreenRow | null>(null);

  const theatresQuery = useQuery({
    queryKey: ['theatres'],
    queryFn: () => theatresApi.list(),
  });

  const screensQuery = useQuery({
    queryKey: ['admin', 'screens'],
    queryFn: async (): Promise<ScreenRow[]> => {
      const theatres = await theatresApi.list();
      const groups = await Promise.all(
        theatres.map(async (theatre) => {
          const screens = await screensApi.byTheatre(theatre.id);
          return screens.map((screen) => ({
            ...screen,
            theatreName: theatre.name,
            theatreId: theatre.id,
          }));
        }),
      );
      return groups.flat();
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'screens'] });
    void queryClient.invalidateQueries({ queryKey: ['theatres'] });
    void queryClient.invalidateQueries({ queryKey: ['shows'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ScreenFormValues) => {
      const payload = {
        name: values.name,
        format: values.format,
        rows: values.rows,
        seatsPerRow: values.seatsPerRow,
        categories: values.categories,
      };
      return editing
        ? screensApi.update(editing.id, payload)
        : screensApi.create(values.theatreId, payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Screen updated' : 'Screen created');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not save screen', error instanceof Error ? error.message : 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (screen: ScreenRow) => screensApi.delete(screen.id),
    onSuccess: () => {
      toast.success('Screen deleted');
      setDeleting(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not delete screen', error instanceof Error ? error.message : 'Please try again.'),
  });

  const theatres = theatresQuery.data ?? [];
  const screens = screensQuery.data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Screens"
        subtitle="Seating layouts, categories and pricing"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />} disabled={!theatres.length}>
            Add screen
          </Button>
        }
      />

      {screensQuery.isLoading || theatresQuery.isLoading ? (
        <TableSkeleton />
      ) : screensQuery.isError ? (
        <ErrorState title="Screens unavailable" message={screensQuery.error instanceof Error ? screensQuery.error.message : undefined} onRetry={() => screensQuery.refetch()} />
      ) : screens.length ? (
        <AdminTable headers={['Screen', 'Theatre', 'Layout', 'Categories', 'Actions']}>
          {screens.map((screen) => (
            <tr key={screen.id}>
              <td className="px-4 py-3">
                <p className="font-semibold text-white">{screen.name}</p>
                <p className="text-xs text-slate-500">{screen.format}</p>
              </td>
              <td className="px-4 py-3 text-slate-300">{screen.theatreName}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{screen.rows} rows × {screen.seatsPerRow} seats</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {(screen.categories ?? []).map((category) => (
                    <span key={category.name} className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-slate-300">
                      {category.name} · {formatCurrency(category.basePrice)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => { setEditing(screen); setFormOpen(true); }} onDelete={() => setDeleting(screen)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <EmptyState icon={<MonitorPlay className="h-7 w-7" />} title="No screens configured" description="Add a screen to a theatre to configure its seating layout." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} disabled={!theatres.length}>Add screen</Button>} />
      )}

      {screens.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {screens.map((screen) => (
            <Card key={screen.id} className="surface-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400"><MonitorPlay className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-white">{screen.name}</p>
                  <p className="text-xs text-slate-500">{screen.theatreName}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">{screen.rows} rows × {screen.seatsPerRow} seats per row · {screen.format}</p>
              <div className="mt-3 space-y-1.5">
                {(screen.categories ?? []).map((category) => (
                  <div key={category.name} className="flex justify-between text-xs">
                    <span className="text-slate-400">{category.name} <span className="text-slate-600">(rows {String(category.startRow)}–{String(category.endRow)})</span></span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(category.basePrice)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ScreenFormModal
        open={formOpen}
        screen={editing}
        theatres={theatres}
        saving={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="Delete this screen?"
        message={`“${deleting?.name ?? ''}” and its seating layout will be removed. Shows using this screen may be affected.`}
        confirmLabel="Delete screen"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function ScreenFormModal({
  open,
  screen,
  theatres,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  screen: ScreenRow | null;
  theatres: Theatre[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ScreenFormValues) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScreenFormValues>({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      theatreId: '',
      name: '',
      format: '2D',
      rows: 10,
      seatsPerRow: 20,
      categories: [{ name: 'Regular', startRow: 0, endRow: 5, basePrice: 180, color: '#e50914' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });

  useEffect(() => {
    if (!open) return;
    reset(
      screen
        ? {
            theatreId: screen.theatreId,
            name: screen.name,
            format: screen.format,
            rows: screen.rows,
            seatsPerRow: screen.seatsPerRow,
            categories: screen.categories?.length
              ? screen.categories.map((category) => ({
                  name: category.name,
                  startRow: Number(category.startRow),
                  endRow: Number(category.endRow),
                  basePrice: Number(category.basePrice),
                  color: category.color ?? '',
                }))
              : [{ name: 'Regular', startRow: 0, endRow: 5, basePrice: 180, color: '#e50914' }],
          }
        : {
            theatreId: theatres[0]?.id ?? '',
            name: '',
            format: '2D',
            rows: 10,
            seatsPerRow: 20,
            categories: [{ name: 'Regular', startRow: 0, endRow: 5, basePrice: 180, color: '#e50914' }],
          },
    );
  }, [open, screen, theatres, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={screen ? 'Edit screen' : 'Add a screen'}
      description="Define the seating grid and price categories. Row numbers start at 0."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>{screen ? 'Save changes' : 'Create screen'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Theatre" error={errors.theatreId?.message} disabled={!!screen} {...register('theatreId')}>
            {theatres.map((theatre) => (
              <option key={theatre.id} value={theatre.id}>{theatre.name} — {theatre.city}</option>
            ))}
          </Select>
          <Input label="Screen name" placeholder="Screen 1" error={errors.name?.message} {...register('name')} />
          <Input label="Format" placeholder="2D / 3D / IMAX" error={errors.format?.message} {...register('format')} />
          <Input label="Rows" type="number" error={errors.rows?.message} {...register('rows')} />
          <Input label="Seats per row" type="number" error={errors.seatsPerRow?.message} {...register('seatsPerRow')} />
        </div>

        <div className="border-t border-white/[0.07] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Seat categories</h3>
              <p className="text-xs text-slate-500">Each category maps to a range of rows and a base price.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => append({ name: '', startRow: 0, endRow: 0, basePrice: 200, color: '#e50914' })}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add category
            </Button>
          </div>
          {errors.categories?.message && <p className="mb-2 text-xs text-brand-300">{errors.categories.message}</p>}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Category {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-brand-500/10 hover:text-brand-300 disabled:opacity-30"
                    aria-label={`Remove category ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input label="Name" placeholder="Premium" error={errors.categories?.[index]?.name?.message} {...register(`categories.${index}.name`)} />
                  <Input label="Start row" type="number" error={errors.categories?.[index]?.startRow?.message} {...register(`categories.${index}.startRow`)} />
                  <Input label="End row" type="number" error={errors.categories?.[index]?.endRow?.message} {...register(`categories.${index}.endRow`)} />
                  <Input label="Base price" type="number" error={errors.categories?.[index]?.basePrice?.message} {...register(`categories.${index}.basePrice`)} />
                  <Input label="Color" placeholder="#e50914" {...register(`categories.${index}.color`)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
