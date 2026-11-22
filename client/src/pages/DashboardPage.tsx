import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  ShieldCheck,
  Ticket as TicketIcon,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { bookingsApi } from '@/api/client';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/store/auth';
import {
  cn,
  formatCurrency,
  formatDateTime,
  formatLongDate,
  formatTime12,
  getInitials,
  isFutureShow,
} from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types/api';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().refine(
    (value) => !value || /^[+\d][\d\s-]{6,14}$/.test(value),
    'Enter a valid phone number',
  ),
});
type ProfileValues = z.infer<typeof profileSchema>;

const statusTone: Record<BookingStatus, 'green' | 'amber' | 'red' | 'blue'> = {
  confirmed: 'green',
  pending: 'amber',
  failed: 'red',
  cancelled: 'blue',
};

export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [editOpen, setEditOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: bookingsApi.mine,
  });

  const bookings = bookingsQuery.data ?? [];
  const { upcoming, past } = useMemo(() => {
    const active = (booking: Booking) =>
      booking.status !== 'cancelled' && booking.status !== 'failed' && isFutureShow(booking.show?.date, booking.show?.time);
    return {
      upcoming: bookings.filter(active),
      past: bookings.filter((booking) => !active(booking)),
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

  if (!user) return <PageLoader label="Loading your dashboard…" />;

  const visible = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="container-cine py-8 sm:py-10">
      <div className="mb-8">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Your space</p>
        <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">HELLO, {user.name.split(' ')[0].toUpperCase()}</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your profile and keep track of every movie night.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-2xl tracking-wide text-white">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-white">{user.name}</h2>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-white/[0.07] pt-5 text-sm">
              <ProfileRow icon={<ShieldCheck className="h-4 w-4" />} label="Account type" value={user.role === 'admin' ? 'Administrator' : 'Customer'} />
              <ProfileRow icon={<UserCircle2 className="h-4 w-4" />} label="Phone" value={user.phone || 'Not added'} />
              <ProfileRow icon={<CalendarDays className="h-4 w-4" />} label="Member since" value={formatDateTime(user.createdAt)} />
            </div>
            <Button variant="outline" fullWidth className="mt-6" onClick={() => setEditOpen(true)} leftIcon={<Pencil className="h-4 w-4" />}>
              Edit profile
            </Button>
          </Card>

          <Card className="bg-gradient-to-br from-brand-600/20 to-transparent">
            <p className="font-display text-2xl tracking-wide text-white">Every seat has a story.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Your next movie night is one click away. Explore what&apos;s showing near you.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex text-sm font-semibold text-brand-400 transition hover:text-brand-300"
            >
              Browse movies →
            </Link>
          </Card>
        </div>

        <Card padded={false}>
          <div className="border-b border-white/[0.07] p-5">
            <CardHeader
              title="My bookings"
              subtitle="All your upcoming and past reservations"
              className="mb-4"
            />
            <Tabs
              tabs={[
                { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
                { id: 'past', label: 'Past', count: past.length },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="p-5">
            {bookingsQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-28 w-full rounded-xl" />
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
                title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings yet'}
                description={tab === 'upcoming' ? 'Find a movie you love and book your seats.' : 'Your completed movie nights will appear here.'}
                action={
                  tab === 'upcoming' ? (
                    <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400">
                      Browse movies
                    </Link>
                  ) : undefined
                }
              />
            )}
          </div>
        </Card>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} onSubmit={updateProfile} />

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

function ProfileRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-slate-500">{icon} {label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
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
          <Badge tone={statusTone[booking.status] ?? 'neutral'}>{booking.status}</Badge>
        </div>
        <div className="mt-3 grid gap-x-4 gap-y-1.5 text-xs text-slate-400 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatLongDate(show?.date)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {formatTime12(show?.time)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {show?.theatre?.name ?? '—'}</span>
          <span className="inline-flex items-center gap-1.5"><TicketIcon className="h-3.5 w-3.5" /> {booking.seats.map((seat) => seat.label).join(', ')}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-2 border-t border-white/[0.07] pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(booking.total)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/ticket/${booking.id}`}
            className={cn(
              'inline-flex h-9 items-center rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-400',
            )}
          >
            Ticket
          </Link>
          {booking.status === 'pending' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs font-medium text-slate-400 transition hover:border-brand-500/40 hover:text-brand-300 disabled:opacity-50"
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

function EditProfileModal({
  open,
  onClose,
  user,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; phone?: string };
  onSubmit: (data: { name?: string; phone?: string }) => Promise<unknown>;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  useEffect(() => {
    if (open) reset({ name: user.name, phone: user.phone ?? '' });
  }, [open, user.name, user.phone, reset]);

  const submit = async (values: ProfileValues) => {
    setSaving(true);
    try {
      await onSubmit(values);
      toast.success('Profile updated', 'Your details have been saved.');
      onClose();
    } catch (error) {
      toast.error('Could not update profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Keep your contact details up to date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit(submit)} loading={saving}>Save changes</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone number" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
      </form>
    </Modal>
  );
}
