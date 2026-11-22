import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building2, MapPin, Plus } from 'lucide-react';
import { theatresApi } from '@/api/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminPageHeader, AdminSearch, AdminTable, RowActions } from '@/pages/Admin/AdminUI';
import { parseCsv, toCsv } from '@/lib/utils';
import type { Theatre } from '@/types/api';

const theatreSchema = z.object({
  name: z.string().trim().min(2, 'Theatre name is required'),
  city: z.string().trim().min(1, 'City is required'),
  address: z.string().trim().min(5, 'Address is required'),
  amenities: z.string().optional(),
  phone: z.string().trim().min(5, 'Phone number is required'),
});
type TheatreFormValues = z.infer<typeof theatreSchema>;

export default function AdminTheatresPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [city, setCity] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Theatre | null>(null);
  const [deleting, setDeleting] = useState<Theatre | null>(null);

  const theatresQuery = useQuery({
    queryKey: ['theatres', { city }],
    queryFn: () => theatresApi.list(city || undefined),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['theatres'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: TheatreFormValues) => {
      const payload = {
        name: values.name,
        city: values.city,
        address: values.address,
        amenities: parseCsv(values.amenities),
        phone: values.phone,
      };
      return editing ? theatresApi.update(editing.id, payload) : theatresApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Theatre updated' : 'Theatre created');
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not save theatre', error instanceof Error ? error.message : 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (theatre: Theatre) => theatresApi.delete(theatre.id),
    onSuccess: () => {
      toast.success('Theatre deleted');
      setDeleting(null);
      invalidate();
    },
    onError: (error: unknown) => toast.error('Could not delete theatre', error instanceof Error ? error.message : 'Please try again.'),
  });

  return (
    <div>
      <AdminPageHeader
        title="Theatres"
        subtitle="Locations, addresses and amenities"
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add theatre</Button>}
      />

      <div className="mb-5">
        <AdminSearch value={city} onChange={setCity} placeholder="Filter by city…" />
      </div>

      {theatresQuery.isLoading ? (
        <TableSkeleton />
      ) : theatresQuery.isError ? (
        <ErrorState title="Theatres unavailable" message={theatresQuery.error instanceof Error ? theatresQuery.error.message : undefined} onRetry={() => theatresQuery.refetch()} />
      ) : theatresQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {theatresQuery.data.map((theatre) => (
            <Card key={theatre.id} className="surface-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{theatre.name}</h3>
                    {theatre.chain && (
                      <div className="mt-1">
                        <Badge tone="purple" className="px-2 py-0.5 text-[10px]">{theatre.chain}</Badge>
                      </div>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {[theatre.area, theatre.city].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 min-h-[40px] text-xs leading-relaxed text-slate-400">{theatre.address}</p>
              <p className="mt-2 text-xs text-slate-500">📞 {theatre.phone || '—'}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(theatre.amenities ?? []).map((amenity) => (
                  <span key={amenity} className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-slate-400">{amenity}</span>
                ))}
              </div>
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <RowActions
                  onEdit={() => { setEditing(theatre); setFormOpen(true); }}
                  onDelete={() => setDeleting(theatre)}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="No theatres found" description="Add a theatre or change the city filter." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Add theatre</Button>} />
      )}

      {theatresQuery.data && theatresQuery.data.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Table view</h3>
          <AdminTable headers={['Name', 'City', 'Address', 'Phone', 'Actions']}>
            {theatresQuery.data.map((theatre) => (
              <tr key={theatre.id}>
                <td className="px-4 py-3 font-semibold text-white">
                  {theatre.name}
                  {theatre.chain && <span className="block text-[11px] font-medium text-brand-300">{theatre.chain}</span>}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {theatre.city}
                  {theatre.area && <span className="block text-[11px] text-slate-500">{theatre.area}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{theatre.address}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{theatre.phone}</td>
                <td className="px-4 py-3">
                  <RowActions onEdit={() => { setEditing(theatre); setFormOpen(true); }} onDelete={() => setDeleting(theatre)} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      )}

      <TheatreFormModal
        open={formOpen}
        theatre={editing}
        saving={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="Delete this theatre?"
        message={`“${deleting?.name ?? ''}” and its screen configuration may be removed. This cannot be undone.`}
        confirmLabel="Delete theatre"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function TheatreFormModal({
  open,
  theatre,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  theatre: Theatre | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: TheatreFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TheatreFormValues>({
    resolver: zodResolver(theatreSchema),
    defaultValues: { name: '', city: '', address: '', amenities: '', phone: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      theatre
        ? { name: theatre.name, city: theatre.city, address: theatre.address, amenities: toCsv(theatre.amenities), phone: theatre.phone }
        : { name: '', city: '', address: '', amenities: '', phone: '' },
    );
  }, [open, theatre, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={theatre ? 'Edit theatre' : 'Add a theatre'}
      description="Separate amenities with commas."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>{theatre ? 'Save changes' : 'Create theatre'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Theatre name" error={errors.name?.message} {...register('name')} />
        <Input label="City" error={errors.city?.message} {...register('city')} />
        <Textarea label="Address" error={errors.address?.message} {...register('address')} />
        <Input label="Amenities (comma separated)" placeholder="Parking, Food court, Dolby Atmos" error={errors.amenities?.message} {...register('amenities')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
      </form>
    </Modal>
  );
}
