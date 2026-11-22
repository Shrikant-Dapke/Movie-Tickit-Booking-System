import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  QrCode,
  Ticket as TicketIcon,
  Trash2,
} from 'lucide-react';
import { bookingsApi } from '@/api/client';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import {
  cn,
  formatCurrency,
  formatDateTime,
  formatLongDate,
  formatTime12,
  isFutureShow,
} from '@/lib/utils';
import type { Booking, BookingStatus, PaymentStatus } from '@/types/api';

const statusTone: Record<BookingStatus, 'green' | 'amber' | 'red' | 'blue'> = {
  confirmed: 'green',
  pending: 'amber',
  failed: 'red',
  cancelled: 'blue',
};

const paymentTone: Record<PaymentStatus, 'green' | 'amber' | 'red' | 'blue'> = {
  paid: 'green',
  unpaid: 'amber',
  failed: 'red',
  refunded: 'blue',
};

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const bookingsQuery = useQuery({ queryKey: ['bookings', 'mine'], queryFn: bookingsApi.mine });
  const bookings = bookingsQuery.data ?? [];

  const groups = useMemo(() => {
    const isUpcoming = (booking: Booking) =>
      booking.status === 'confirmed' && isFutureShow(booking.show?.date, booking.show?.time);
    return {
      upcoming: bookings.filter(isUpcoming),
      past: bookings.filter((booking) => !isUpcoming(booking)),
      all: [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }, [bookings]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled', 'Your reservation has been released.');
      setCancelId(null);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
    onError: (error: unknown) => {
      toast.error('Could not cancel booking', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const visible = groups[tab as keyof typeof groups] ?? groups.all;

  return (
    <div className="container-cine py-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Reservation manager</p>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">MY BOOKINGS</h1>
          <p className="mt-2 text-sm text-slate-400">Every ticket you have reserved, in one place.</p>
        </div>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400"
        >
          Book a movie
        </Link>
      </div>

      <Card padded={false}>
        <div className="border-b border-white/[0.07] p-5">
          <CardHeader
            title="Booking history"
            subtitle={`${bookings.length} reservation${bookings.length === 1 ? '' : 's'} on your account`}
            className="mb-4"
          />
          <Tabs
            tabs={[
              { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
              { id: 'past', label: 'Past & history', count: groups.past.length },
              { id: 'all', label: 'All', count: groups.all.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div className="p-5">
          {bookingsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : bookingsQuery.isError ? (
            <ErrorState
              title="Bookings unavailable"
              message={bookingsQuery.error instanceof Error ? bookingsQuery.error.message : undefined}
              onRetry={() => bookingsQuery.refetch()}
            />
          ) : visible.length ? (
            <div className="space-y-3">
              {visible.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onCancel={() => setCancelId(booking.id)}
                  cancelling={cancelMutation.isPending && cancelMutation.variables === booking.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<TicketIcon className="h-7 w-7" />}
              title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past bookings yet' : 'No bookings yet'}
              description={
                tab === 'upcoming'
                  ? 'Pick a movie, choose your seats and your reservation will appear here.'
                  : 'Your completed and previous reservations will appear here.'
              }
              action={
                <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400">
                  Browse movies
                </Link>
              }
            />
          )}
        </div>
      </Card>

      <ConfirmModal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
        title="Cancel this booking?"
        message="The seats will be released and this reservation can no longer be used. This action cannot be undone."
        confirmLabel="Cancel booking"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const show = booking.show;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-ink-900/60 p-4 transition hover:border-brand-500/30 sm:flex-row">
      <PosterImage
        src={show?.movie?.poster}
        alt={show?.movie?.title ?? 'Movie'}
        className="aspect-[2/3] w-20 shrink-0 self-center rounded-lg sm:w-16"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">{show?.movie?.title ?? 'Movie'}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-brand-400">{booking.code}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={statusTone[booking.status] ?? 'neutral'}>{booking.status}</Badge>
            <Badge tone={paymentTone[booking.paymentStatus] ?? 'neutral'}>{booking.paymentStatus}</Badge>
          </div>
        </div>

        <div className="mt-3 grid gap-x-4 gap-y-1.5 text-xs text-slate-400 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatLongDate(show?.date)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {formatTime12(show?.time)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {show?.theatre?.name ?? '—'} · {show?.screen?.name ?? '—'}</span>
          <span className="inline-flex items-center gap-1.5"><TicketIcon className="h-3.5 w-3.5" /> Seats: {booking.seats.map((seat) => seat.label).join(', ')}</span>
          <span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Booked {formatDateTime(booking.createdAt)}</span>
        </div>

        {booking.status === 'cancelled' && (
          <p className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/[0.07] px-3 py-2 text-[11px] text-sky-300">
            This booking was cancelled{booking.paymentStatus === 'refunded' ? ' and the payment was refunded (simulated).' : '; the seats were released.'}
          </p>
        )}
        {booking.status === 'failed' && (
          <p className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/[0.07] px-3 py-2 text-[11px] text-brand-300">
            The simulated payment failed. No money was charged and no seats were reserved.
          </p>
        )}
        <QrPreview booking={booking} />
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-2 border-t border-white/[0.07] pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Total paid</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(booking.total)}</p>
        </div>
        <div className="flex gap-2">
          {booking.status === 'confirmed' ? (
            <Link
              to={`/ticket/${booking.id}`}
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-400"
            >
              View ticket
            </Link>
          ) : (
            <Link
              to={`/booking/${booking.id}/confirmation`}
              className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:border-brand-500/40"
            >
              Details
            </Link>
          )}
          {booking.status === 'pending' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className={cn(
                'inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs font-medium text-slate-400 transition hover:border-brand-500/40 hover:text-brand-300 disabled:opacity-50',
              )}
              title="Cancel booking"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small QR preview pulled from the real ticket endpoint; only confirmed tickets have one. */
function QrPreview({ booking }: { booking: Booking }) {
  const query = useQuery({
    queryKey: ['ticket-qr', booking.id],
    queryFn: () => bookingsApi.ticket(booking.id),
    enabled: booking.status === 'confirmed',
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
  if (booking.status !== 'confirmed' || !query.data?.qrDataUrl) return null;
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-3">
      <img src={query.data.qrDataUrl} alt={`QR code for booking ${booking.code}`} className="h-14 w-14 rounded-md bg-white p-1" />
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><QrCode className="h-3.5 w-3.5 text-brand-400" /> Digital ticket</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Scan at the theatre entrance. This is a simulated ticket.</p>
      </div>
    </div>
  );
}
