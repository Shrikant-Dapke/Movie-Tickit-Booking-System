import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { bookingsApi } from '@/api/client';
import { Ticket } from '@/components/Ticket';
import { ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';

export default function TicketPage() {
  const { id = '' } = useParams();
  const ticketQuery = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => bookingsApi.ticket(id),
    enabled: !!id,
  });

  if (ticketQuery.isLoading) return <PageLoader label="Loading ticket…" />;

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <div className="container-cine py-12">
        <ErrorState
          title="Ticket unavailable"
          message={ticketQuery.error instanceof Error ? ticketQuery.error.message : 'This ticket could not be loaded.'}
          onRetry={() => ticketQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container-cine py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> My bookings
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 transition hover:text-brand-300"
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      <div className="mb-7 text-center">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Your digital ticket</p>
        <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">READY FOR THE BIG SCREEN</h1>
        <p className="mt-2 text-sm text-slate-400">Print this ticket or download a standalone copy for offline use.</p>
      </div>

      <div className="mx-auto max-w-4xl">
        <Ticket data={ticketQuery.data} />
      </div>
    </div>
  );
}
