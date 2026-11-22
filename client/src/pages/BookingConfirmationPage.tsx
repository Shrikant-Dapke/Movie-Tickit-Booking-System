import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, LayoutDashboard, Ticket as TicketIcon } from 'lucide-react';
import { bookingsApi } from '@/api/client';
import { Ticket } from '@/components/Ticket';
import { ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';

export default function BookingConfirmationPage() {
  const { id = '' } = useParams();

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.get(id),
    enabled: !!id,
  });
  const ticketQuery = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => bookingsApi.ticket(id),
    enabled: !!id,
  });

  if (bookingQuery.isLoading || ticketQuery.isLoading) return <PageLoader label="Preparing your confirmation…" />;

  if (bookingQuery.isError || ticketQuery.isError || !bookingQuery.data || !ticketQuery.data) {
    return (
      <div className="container-cine py-12">
        <ErrorState
          title="Could not load this booking"
          message={
            bookingQuery.error instanceof Error
              ? bookingQuery.error.message
              : ticketQuery.error instanceof Error
                ? ticketQuery.error.message
                : 'Please check your bookings page for this reservation.'
          }
          onRetry={() => {
            void bookingQuery.refetch();
            void ticketQuery.refetch();
          }}
        />
        <div className="mt-6 text-center">
          <Link to="/dashboard?tab=bookings" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
            Go to my bookings
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;
  const confirmed = booking.status === 'confirmed';

  return (
    <div className="container-cine py-10 sm:py-14">
      <div className="mx-auto mb-8 max-w-2xl text-center animate-fade-up">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${confirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
          {confirmed ? <CheckCircle2 className="h-9 w-9" /> : <AlertTriangle className="h-9 w-9" />}
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
          {confirmed ? 'Booking confirmed' : 'Booking created'}
        </p>
        <h1 className="font-display text-5xl tracking-wide text-white sm:text-6xl">
          {confirmed ? 'SEE YOU AT THE MOVIES' : 'PAYMENT PENDING'}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          {confirmed ? (
            <>
              Your seats for <span className="font-semibold text-white">{booking.show?.movie?.title}</span> are confirmed.
              Booking ID: <span className="font-display text-lg tracking-wide text-brand-400">{booking.code}</span>
            </>
          ) : (
            <>This booking is not confirmed yet. Check your bookings page to complete payment.</>
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={`/ticket/${id}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            <TicketIcon className="h-4 w-4" /> View digital ticket
          </Link>
          <Link
            to="/dashboard?tab=bookings"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07]"
          >
            <LayoutDashboard className="h-4 w-4" /> My bookings
          </Link>
        </div>
      </div>

      {!confirmed && (
        <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-sm text-amber-200">
          Payment status: <span className="font-semibold">{booking.paymentStatus}</span>. No money was charged (simulated payment).
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <Ticket data={ticketQuery.data} />
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm font-medium text-slate-400 transition hover:text-white">
          Browse more movies →
        </Link>
      </div>
    </div>
  );
}
