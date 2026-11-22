import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ApiError, holdsApi, showsApi } from '@/api/client';
import { SeatLegend, SeatMap } from '@/components/SeatMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency, formatLongDate, formatTime12 } from '@/lib/utils';
import type { SeatState } from '@/types/api';

const MAX_SEATS = 8;

export default function SeatSelectionPage() {
  const { showId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const initializedFor = useRef<string | null>(null);
  const selectedRef = useRef<string[]>([]);
  const releasing = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const showQuery = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.get(showId),
    enabled: !!showId,
  });

  const seatsQuery = useQuery({
    queryKey: ['seats', showId],
    queryFn: () => showsApi.seats(showId),
    enabled: !!showId,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const seats = seatsQuery.data?.seats ?? [];

  // Restore the user's own held seats on first load.
  useEffect(() => {
    if (!seatsQuery.data || initializedFor.current === showId) return;
    initializedFor.current = showId;
    const mine = seatsQuery.data.seats
      .filter((seat) => seat.mine && seat.status !== 'booked')
      .slice(0, MAX_SEATS)
      .map((seat) => seat.label);
    if (mine.length) {
      setSelected(mine);
      toast.info('Holds restored', 'We restored the seats you previously reserved.');
    }
  }, [seatsQuery.data, showId, toast]);

  // Drop seats that another customer has taken while polling.
  useEffect(() => {
    if (!seatsQuery.data) return;
    const unusable = selectedRef.current.filter((label) => {
      const seat = seatsQuery.data?.seats.find((item) => item.label === label);
      return !seat || seat.status === 'booked' || (seat.status === 'held' && !seat.mine);
    });
    if (unusable.length) {
      setSelected((current) => current.filter((label) => !unusable.includes(label)));
      toast.warning('Seat availability changed', `${unusable.join(', ')} ${unusable.length === 1 ? 'is' : 'are'} no longer available.`);
    }
  }, [seatsQuery.data, toast]);

  const selectedSeats = useMemo(
    () =>
      selected
        .map((label) => seats.find((seat) => seat.label === label))
        .filter((seat): seat is SeatState => !!seat),
    [selected, seats],
  );

  const subtotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  const hasMine = seats.some((seat) => seat.mine && seat.status !== 'booked');

  const toggleSeat = (label: string) => {
    const seat = seats.find((item) => item.label === label);
    if (!seat || seat.status === 'booked' || (seat.status === 'held' && !seat.mine)) return;

    if (!selected.includes(label) && selected.length >= MAX_SEATS) {
      toast.warning('Seat limit reached', `You can select up to ${MAX_SEATS} seats per booking.`);
      return;
    }
    setSelected((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const handleContinue = async () => {
    if (!selected.length) return;
    setCreating(true);
    try {
      await holdsApi.create(showId, selected);
      toast.success('Seats reserved', 'Your seats are held for 5 minutes. Complete checkout to confirm.');
      navigate(`/checkout?show=${encodeURIComponent(showId)}&seats=${encodeURIComponent(selected.join(','))}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Seats no longer available', 'Someone else reserved these seats. Please choose different ones.');
        void seatsQuery.refetch();
      } else {
        toast.error('Could not reserve seats', error instanceof Error ? error.message : 'Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRelease = async () => {
    if (releasing.current) return;
    releasing.current = true;
    try {
      await holdsApi.release(showId);
      setSelected([]);
      toast.info('Holds released', 'Your reserved seats are available to other customers.');
      await seatsQuery.refetch();
    } catch (error) {
      toast.error('Could not release holds', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      releasing.current = false;
    }
  };

  if (showQuery.isLoading) return <PageLoader label="Loading show…" />;
  if (showQuery.isError || !showQuery.data) {
    return (
      <div className="container-cine py-12">
        <ErrorState
          title="Show not found"
          message={showQuery.error instanceof Error ? showQuery.error.message : 'This show could not be loaded.'}
          onRetry={() => showQuery.refetch()}
        />
      </div>
    );
  }

  const show = showQuery.data;

  return (
    <div className="container-cine py-8 sm:py-10">
      <Link to={`/movies/${show.movie?.id ?? ''}`} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to movie
      </Link>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Step 1 of 3 · Choose seats</p>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">{show.movie?.title ?? 'Select seats'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {show.theatre?.name}{show.theatre?.city ? `, ${show.theatre.city}` : ''}</span>
            <span className="inline-flex items-center gap-1.5"><MonitorPlay className="h-4 w-4" /> {show.screen?.name}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatLongDate(show.date)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {formatTime12(show.time)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="blue">{show.format}</Badge>
          <button
            type="button"
            onClick={() => void seatsQuery.refetch()}
            disabled={seatsQuery.isFetching}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-ink-850 px-3 text-xs font-semibold text-slate-300 transition hover:border-brand-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', seatsQuery.isFetching && 'animate-spin')} /> Refresh seats
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-base font-bold text-white">Pick your seats</h2>
              <p className="mt-1 text-xs text-slate-400">
                Live availability · refreshes every 15 seconds · maximum {MAX_SEATS} seats
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 font-semibold text-emerald-400">
                {seatsQuery.data?.available ?? 0} available
              </span>
              <span className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 font-semibold text-amber-400">
                {seatsQuery.data?.held ?? 0} held
              </span>
              <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 font-semibold text-slate-400">
                {seatsQuery.data?.booked ?? 0} booked
              </span>
            </div>
          </div>

          <div className="border-b border-white/[0.07] px-5 py-4">
            <SeatLegend />
          </div>

          <div className="p-4 sm:p-6">
            {seatsQuery.isLoading ? (
              <div className="grid gap-2">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="skeleton mx-auto h-9 w-[70%] rounded-lg" />
                ))}
              </div>
            ) : seatsQuery.isError ? (
              <ErrorState
                title="Seat map unavailable"
                message={seatsQuery.error instanceof Error ? seatsQuery.error.message : undefined}
                onRetry={() => seatsQuery.refetch()}
              />
            ) : (
              <SeatMap
                seats={seats}
                categories={seatsQuery.data?.categories ?? []}
                selected={selected}
                onToggle={toggleSeat}
                maxSeats={MAX_SEATS}
              />
            )}
          </div>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-bold text-white">Booking summary</h2>
          <div className="mb-5 space-y-2 border-b border-white/[0.07] pb-5 text-sm">
            <SummaryRow label="Movie" value={show.movie?.title ?? '—'} />
            <SummaryRow label="Show" value={`${formatLongDate(show.date).split(',')[0]}, ${formatTime12(show.time)}`} />
            <SummaryRow label="Theatre" value={show.theatre?.name ?? '—'} />
            <SummaryRow label="Format" value={show.format} />
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Selected seats</p>
              <span className="text-xs font-semibold text-brand-400">{selected.length}/{MAX_SEATS}</span>
            </div>
            {selectedSeats.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <button
                    key={seat.label}
                    type="button"
                    onClick={() => toggleSeat(seat.label)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1.5 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/20"
                    title="Click to remove"
                  >
                    {seat.label} <span className="text-slate-500">{formatCurrency(seat.price)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
                Select seats from the map to continue
              </p>
            )}
          </div>

          <div className="mb-5 space-y-2 border-t border-white/[0.07] pt-5 text-sm">
            <SummaryRow label={`Tickets (${selectedSeats.length})`} value={formatCurrency(subtotal)} />
            <div className="h-px bg-white/[0.07]" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Subtotal</span>
              <span className="font-display text-2xl tracking-wide text-emerald-400">{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Taxes, discounts and final pricing are calculated and verified by the server when the booking is created.
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleContinue}
            disabled={!selected.length || creating}
            loading={creating}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to checkout
          </Button>

          {hasMine && (
            <button
              type="button"
              onClick={handleRelease}
              className="mt-3 w-full text-center text-xs font-medium text-slate-500 transition hover:text-brand-300"
            >
              Release my held seats
            </button>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-ink-800/60 p-3 text-[11px] leading-relaxed text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Seats are locked atomically when you continue. Another customer cannot book them while your hold is active.
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <Users className="h-4 w-4" /> Seating layout may vary by screen. Prices shown are per seat.
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}
