import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowLeft,
  BadgePercent,
  CheckCircle2,
  CreditCard,
  Landmark,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tag,
  XCircle,
} from 'lucide-react';
import { ApiError, bookingsApi, promoApi, showsApi } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/store/auth';
import { cn, formatCurrency, formatLongDate, formatTime12 } from '@/lib/utils';
import type { Booking, Payment, PaymentMethod, PaymentOutcome, PromoValidation, SeatState } from '@/types/api';

const promoSchema = z.object({
  code: z.string().trim().min(1, 'Enter a promo code'),
});
type PromoValues = z.infer<typeof promoSchema>;

const METHODS: Array<{ id: PaymentMethod; label: string; hint: string; icon: typeof CreditCard }> = [
  { id: 'card', label: 'Card', hint: 'Credit / debit card', icon: CreditCard },
  { id: 'upi', label: 'UPI', hint: 'Any UPI app', icon: Smartphone },
  { id: 'netbanking', label: 'Net banking', hint: 'All major banks', icon: Landmark },
];

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const showId = params.get('show') ?? '';
  const seats = useMemo(
    () => (params.get('seats') ?? '').split(',').map((seat) => seat.trim()).filter(Boolean),
    [params],
  );

  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [outcome, setOutcome] = useState<PaymentOutcome>('success');
  const [processing, setProcessing] = useState(false);
  const [failureBooking, setFailureBooking] = useState<Booking | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PromoValues>({ resolver: zodResolver(promoSchema), defaultValues: { code: '' } });

  const showQuery = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.get(showId),
    enabled: !!showId,
  });
  const seatsQuery = useQuery({
    queryKey: ['seats', showId],
    queryFn: () => showsApi.seats(showId),
    enabled: !!showId,
  });

  const selectedSeats = useMemo(
    () =>
      seats
        .map((label) => seatsQuery.data?.seats.find((seat: SeatState) => seat.label === label))
        .filter((seat): seat is SeatState => !!seat),
    [seats, seatsQuery.data],
  );
  const subtotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  const discount = promo?.valid ? Number(promo.discount || 0) : 0;
  const total = promo?.valid && Number(promo.total) > 0 ? Number(promo.total) : Math.max(0, subtotal - discount);

  const applyPromo = async (values: PromoValues) => {
    try {
      const result = await promoApi.validate(values.code.trim().toUpperCase(), subtotal);
      setPromo(result);
      toast.success('Promo applied', `${result.code} saves you ${formatCurrency(result.discount)}.`);
    } catch (error) {
      setPromo(null);
      const message = error instanceof Error ? error.message : 'This promo code is not valid.';
      setError('code', { message });
      toast.error('Invalid promo code', message);
    }
  };

  const processPayment = async (forcedOutcome?: PaymentOutcome) => {
    if (!showId || !seats.length) {
      toast.error('No seats selected', 'Please choose your seats first.');
      return;
    }
    setProcessing(true);
    try {
      const booking = failureBooking ?? (await bookingsApi.create({
        showId,
        seats,
        promoCode: promo?.valid ? promo.code : undefined,
      }));
      setFailureBooking(null);
      const confirmed = await bookingsApi.pay(booking.id, {
        method,
        outcome: forcedOutcome ?? outcome,
      });
      toast.success('Payment successful (simulated)', 'Your booking is confirmed.');
      navigate(`/booking/${confirmed.booking.id}/confirmation`, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        const data = error.data as { booking?: Booking; payment?: Payment } | undefined;
        if (data?.booking) setFailureBooking(data.booking);
        toast.error(
          'Payment failed (simulated)',
          data?.payment?.failureReason || 'The simulated gateway declined this transaction.',
        );
      } else if (error instanceof ApiError && error.status === 409) {
        toast.error('Seats unavailable', 'Your hold may have expired. Please pick seats again.');
        navigate(`/shows/${showId}/seats`, { replace: true });
      } else {
        toast.error('Checkout failed', error instanceof Error ? error.message : 'Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!showId || !seats.length) {
    return (
      <div className="container-cine py-16">
        <EmptyState
          title="No seats selected"
          description="Choose your seats before heading to checkout."
          action={<Button onClick={() => navigate('/')}>Browse movies</Button>}
        />
      </div>
    );
  }

  if (showQuery.isLoading || seatsQuery.isLoading) return <PageLoader label="Preparing checkout…" />;

  if (showQuery.isError || !showQuery.data) {
    return (
      <div className="container-cine py-12">
        <ErrorState
          title="Show unavailable"
          message={showQuery.error instanceof Error ? showQuery.error.message : undefined}
          onRetry={() => showQuery.refetch()}
        />
      </div>
    );
  }

  const show = showQuery.data;

  return (
    <div className="container-cine py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(`/shows/${showId}/seats`)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to seats
      </button>

      <div className="mb-7">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Step 2 of 3 · Checkout</p>
        <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">Review & pay</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-bold text-amber-300">SIMULATED PAYMENT — no real money is charged</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            This is a demonstration gateway. Choose an outcome below to simulate a successful or failed transaction. Do not enter real card details.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-base font-bold text-white">Your booking</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Movie" value={show.movie?.title ?? '—'} />
              <InfoBlock label="Theatre" value={`${show.theatre?.name ?? '—'}${show.theatre?.city ? `, ${show.theatre.city}` : ''}`} />
              <InfoBlock label="Date & time" value={`${formatLongDate(show.date)} · ${formatTime12(show.time)}`} />
              <InfoBlock label="Screen / format" value={`${show.screen?.name ?? '—'} · ${show.format}`} />
            </div>
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Seats</p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.length ? (
                  selectedSeats.map((seat) => (
                    <span key={seat.label} className="rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200">
                      {seat.label} <span className="font-normal text-slate-500">· {seat.category} · {formatCurrency(seat.price)}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Seat details unavailable — prices will be verified by the server.</span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">Promo code</h2>
            </div>
            <form onSubmit={handleSubmit(applyPromo)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Input
                placeholder="Enter code"
                aria-label="Promo code"
                className="uppercase"
                error={errors.code?.message}
                disabled={!!promo?.valid}
                {...register('code')}
              />
              {promo?.valid ? (
                <Button
                  variant="outline"
                  onClick={() => setPromo(null)}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  className="shrink-0"
                >
                  Remove
                </Button>
              ) : (
                <Button type="submit" variant="secondary" className="shrink-0" leftIcon={<BadgePercent className="h-4 w-4" />}>
                  Apply
                </Button>
              )}
            </form>
            {promo?.valid && (
              <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {promo.code} applied — {promo.discountPercent}% off ({formatCurrency(promo.discount)} saved)
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 text-base font-bold text-white">Payment method</h2>
            <p className="mb-4 text-xs text-slate-400">Select how you would like to pay in this simulation.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {METHODS.map((item) => {
                const Icon = item.icon;
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition',
                      active
                        ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_0_1px_rgba(229,9,20,0.3)]'
                        : 'border-white/10 bg-ink-900/60 hover:border-white/25',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-brand-400' : 'text-slate-400')} />
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.hint}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Simulate payment outcome</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOutcome('success')}
                  aria-pressed={outcome === 'success'}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition',
                    outcome === 'success'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 text-slate-400 hover:border-white/25',
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" /> Successful
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('failure')}
                  aria-pressed={outcome === 'failure'}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition',
                    outcome === 'failure'
                      ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                      : 'border-white/10 text-slate-400 hover:border-white/25',
                  )}
                >
                  <XCircle className="h-4 w-4" /> Failed
                </button>
              </div>
            </div>
          </Card>

          {failureBooking && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/[0.07] p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Simulated payment failed</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Booking <span className="font-semibold text-white">{failureBooking.code}</span> was created but remains unpaid. No money was charged. You can retry the simulated payment.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button size="sm" onClick={() => processPayment('success')} loading={processing} leftIcon={<RefreshCw className="h-4 w-4" />}>
                      Retry payment (simulate success)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFailureBooking(null)}
                      disabled={processing}
                    >
                      Adjust payment details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Card className="lg:sticky lg:top-24">
          <h2 className="mb-5 text-base font-bold text-white">Price summary</h2>
          <div className="space-y-3 text-sm">
            <Row label={`Tickets (${selectedSeats.length})`} value={formatCurrency(subtotal)} />
            {discount > 0 && <Row label={`Promo ${promo?.code ?? ''}`} value={`− ${formatCurrency(discount)}`} accent />}
            <div className="h-px bg-white/[0.07]" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Total payable</span>
              <span className="font-display text-3xl tracking-wide text-emerald-400">{formatCurrency(total)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Final amount is re-verified by the server before your booking is confirmed.
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={() => processPayment()}
            loading={processing}
            disabled={processing}
            rightIcon={<LockKeyhole className="h-4 w-4" />}
          >
            {failureBooking ? 'Retry simulated payment' : `Pay ${formatCurrency(total)} (simulated)`}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Signed in as {user?.name ?? 'customer'}
          </p>
        </Card>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className={cn('font-semibold', accent ? 'text-emerald-400' : 'text-slate-200')}>{value}</span>
    </div>
  );
}
