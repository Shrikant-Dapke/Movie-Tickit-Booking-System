import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, Ticket, UserRound } from 'lucide-react';
import { adminApi, bookingsApi } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminPageHeader, AdminSearch, AdminTable, StatusBadge } from '@/pages/Admin/AdminUI';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDateTime, formatTime12 } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types/api';

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'failed', 'cancelled'];

export default function AdminBookingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings', { status, search: debouncedSearch }],
    queryFn: () => adminApi.bookings({ status: status || undefined, search: debouncedSearch || undefined }),
  });

  const detailQuery = useQuery({
    queryKey: ['booking', detailId],
    queryFn: () => bookingsApi.get(detailId ?? ''),
    enabled: !!detailId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: BookingStatus }) => adminApi.updateBooking(id, { status: next }),
    onSuccess: () => {
      toast.success('Booking updated', 'The booking status has been changed.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (error: unknown) => toast.error('Could not update booking', error instanceof Error ? error.message : 'Please try again.'),
  });

  return (
    <div>
      <AdminPageHeader title="Bookings" subtitle="Search, inspect and manage every reservation" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search by code, customer or movie…" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" wrapperClassName="sm:w-56">
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </div>

      {bookingsQuery.isLoading ? (
        <TableSkeleton />
      ) : bookingsQuery.isError ? (
        <ErrorState title="Bookings unavailable" message={bookingsQuery.error instanceof Error ? bookingsQuery.error.message : undefined} onRetry={() => bookingsQuery.refetch()} />
      ) : bookingsQuery.data?.length ? (
        <AdminTable headers={['Booking', 'Customer', 'Movie / Show', 'Amount', 'Status', 'Payment', 'Actions']}>
          {bookingsQuery.data.map((booking) => {
            const customer = typeof booking.user === 'object' && booking.user ? booking.user.name : 'Customer';
            return (
              <tr key={booking.id}>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-semibold text-brand-400">{booking.code}</p>
                  <p className="text-[11px] text-slate-500">{formatDateTime(booking.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{customer}</td>
                <td className="px-4 py-3 text-xs text-slate-300">
                  {booking.show?.movie?.title ?? '—'}
                  <span className="block text-slate-500">{booking.show?.theatre?.name ?? ''} · {formatTime12(booking.show?.time)}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(booking.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-400">{booking.paymentStatus}</td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" onClick={() => setDetailId(booking.id)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                    View
                  </Button>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <EmptyState icon={<Ticket className="h-7 w-7" />} title="No bookings found" description="Try changing your search or status filter." />
      )}

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Booking details"
        description="Inspect the reservation and update its status."
        size="lg"
      >
        {detailQuery.isLoading ? (
          <TableSkeleton rows={3} />
        ) : detailQuery.isError || !detailQuery.data ? (
          <ErrorState message={detailQuery.error instanceof Error ? detailQuery.error.message : undefined} onRetry={() => detailQuery.refetch()} />
        ) : (
          <BookingDetail
            booking={detailQuery.data}
            saving={updateMutation.isPending}
            onUpdate={(next) => detailId && updateMutation.mutate({ id: detailId, next })}
          />
        )}
      </Modal>
    </div>
  );
}

function BookingDetail({
  booking,
  saving,
  onUpdate,
}: {
  booking: Booking;
  saving: boolean;
  onUpdate: (status: BookingStatus) => void;
}) {
  const [nextStatus, setNextStatus] = useState<BookingStatus>(booking.status);

  useEffect(() => {
    setNextStatus(booking.status);
  }, [booking.status, booking.id]);

  const customer = typeof booking.user === 'object' && booking.user ? booking.user : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-semibold text-brand-400">{booking.code}</p>
          <p className="text-xs text-slate-500">Created {formatDateTime(booking.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <Link
            to={`/ticket/${booking.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:border-brand-500/40 hover:text-white"
          >
            <Ticket className="h-3.5 w-3.5" /> Ticket
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><UserRound className="h-4 w-4" /> Customer</p>
          <p className="text-sm font-semibold text-white">{customer?.name ?? 'Customer'}</p>
          <p className="text-xs text-slate-400">{customer?.email ?? '—'}</p>
          <p className="text-xs text-slate-500">{customer?.phone || 'No phone added'}</p>
        </Card>
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Show</p>
          <p className="text-sm font-semibold text-white">{booking.show?.movie?.title ?? '—'}</p>
          <p className="text-xs text-slate-400">{booking.show?.theatre?.name ?? '—'} · {booking.show?.screen?.name ?? '—'}</p>
          <p className="text-xs text-slate-500">{booking.show?.date} · {formatTime12(booking.show?.time)}</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Seats & pricing</p>
        <div className="flex flex-wrap gap-2">
          {booking.seats.map((seat) => (
            <span key={seat.label} className="rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-xs text-slate-200">
              {seat.label} · {seat.category} · {formatCurrency(seat.price)}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-white/[0.07] pt-4 text-sm sm:grid-cols-3">
          <div><span className="text-slate-500">Subtotal: </span><span className="text-slate-200">{formatCurrency(booking.amount)}</span></div>
          <div><span className="text-slate-500">Discount: </span><span className="text-emerald-400">{formatCurrency(booking.discount)}</span></div>
          <div><span className="text-slate-500">Total: </span><span className="font-bold text-white">{formatCurrency(booking.total)}</span></div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Update status</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as BookingStatus)} aria-label="New booking status" className="flex-1">
            {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button
            onClick={() => onUpdate(nextStatus)}
            disabled={saving || nextStatus === booking.status}
          >
            Save status
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Payment status: {booking.paymentStatus} · Simulated payment flow</p>
      </Card>
    </div>
  );
}
