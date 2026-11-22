import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Film,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { bookingsApi } from '@/api/client';
import { PosterImage } from '@/components/PosterImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageLoader } from '@/components/ui/Spinner';
import { MetricSkeleton, StatusBadge } from '@/pages/Admin/AdminUI';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/store/auth';
import { cn, formatCurrency, formatDateTime, formatLongDate, formatTime12, getInitials } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().refine(
    (value) => !value || /^[+\d][\d\s-]{6,14}$/.test(value),
    'Enter a valid phone number',
  ),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function CustomerDashboardPage() {
  const { user, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ['bookings', 'summary'],
    queryFn: bookingsApi.summary,
  });
  const summary = summaryQuery.data;

  const metrics = useMemo(
    () =>
      summary
        ? [
            { label: 'Total bookings', value: summary.totalBookings, icon: TicketIcon, tone: 'text-brand-400' },
            { label: 'Upcoming', value: summary.upcomingBookings, icon: CalendarDays, tone: 'text-sky-400' },
            { label: 'Movies watched', value: summary.moviesWatched, icon: Film, tone: 'text-violet-400' },
            { label: 'Amount spent', value: formatCurrency(summary.totalSpent), icon: Wallet, tone: 'text-emerald-400' },
          ]
        : [],
    [summary],
  );

  if (!user) return <PageLoader label="Loading your dashboard…" />;

  const next = summary?.nextUpcoming;

  return (
    <div className="container-cine py-8 sm:py-10">
      {/* Welcome */}
      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            <Sparkles className="h-3.5 w-3.5" /> Your personal space
          </p>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
            WELCOME BACK, {user.name.split(' ')[0].toUpperCase()}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Here&apos;s your movie life at a glance — from upcoming showtimes to everything you&apos;ve watched.
          </p>
        </div>
        <Badge tone="green">Member since {formatDateTime(user.createdAt)}</Badge>
      </section>

      {/* Statistics */}
      {summaryQuery.isLoading ? (
        <MetricSkeleton />
      ) : summaryQuery.isError ? (
        <ErrorState
          title="Dashboard data unavailable"
          message={summaryQuery.error instanceof Error ? summaryQuery.error.message : undefined}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="surface-hover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                    <p className="mt-2 font-display text-3xl tracking-wide text-white sm:text-4xl">{metric.value}</p>
                  </div>
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]', metric.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          {/* Upcoming movie */}
          <section>
            <SectionTitle eyebrow="Next up" title="Your upcoming movie" />
            {summaryQuery.isLoading ? (
              <Skeleton className="h-56 w-full rounded-2xl" />
            ) : next ? (
              <Card padded={false} className="overflow-hidden">
                <div className="flex flex-col gap-5 p-5 sm:flex-row">
                  <PosterImage
                    src={next.show?.movie?.poster}
                    alt={next.show?.movie?.title ?? 'Movie'}
                    className="aspect-[2/3] w-28 shrink-0 self-start rounded-xl sm:w-32"
                  />
                  <div className="min-w-0 flex-1">
                    <Badge tone="red">Confirmed</Badge>
                    <h3 className="mt-3 font-display text-3xl tracking-wide text-white">{next.show?.movie?.title ?? 'Movie'}</h3>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-400" /> {next.show?.theatre?.name ?? '—'} · {next.show?.screen?.name ?? '—'}</span>
                      <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-400" /> {formatLongDate(next.show?.date)}</span>
                      <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-brand-400" /> {formatTime12(next.show?.time)}</span>
                      <span className="inline-flex items-center gap-2"><TicketIcon className="h-4 w-4 text-brand-400" /> Seats: {next.seats.map((seat) => seat.label).join(', ')}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={`/ticket/${next.id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400"
                      >
                        View ticket <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link to="/bookings" className="inline-flex h-10 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                        All bookings
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <EmptyState
                  icon={<Film className="h-7 w-7" />}
                  title="No upcoming movie yet"
                  description="Your next confirmed booking will appear here with a direct ticket link."
                  action={
                    <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400">
                      Browse movies
                    </Link>
                  }
                />
              </Card>
            )}
          </section>

          {/* Recent activity */}
          <section>
            <SectionTitle
              eyebrow="Activity"
              title="Recent activity"
              action={<Link to="/bookings" className="text-sm font-semibold text-brand-400 hover:text-brand-300">View all bookings →</Link>}
            />
            <Card padded={false}>
              {summaryQuery.isLoading ? (
                <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : summary?.recentActivity?.length ? (
                <div className="divide-y divide-white/[0.06]">
                  {summary.recentActivity.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{item.movie}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">{item.code} · Booked {formatDateTime(item.bookingDate)}</p>
                      </div>
                      <StatusBadge status={item.status} />
                      <Badge tone={item.paymentStatus === 'paid' ? 'green' : item.paymentStatus === 'failed' ? 'red' : 'blue'}>
                        {item.paymentStatus}
                      </Badge>
                      <p className="w-20 text-right text-sm font-bold text-emerald-400">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5"><EmptyState title="No activity yet" description="Bookings you make will show up here." /></div>
              )}
            </Card>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Quick actions" subtitle="Pick up where you left off" className="mb-4" />
            <div className="space-y-2">
              <QuickAction to="/" icon={<Film className="h-4 w-4" />} label="Browse movies" />
              <QuickAction to="/bookings" icon={<TicketIcon className="h-4 w-4" />} label="My bookings" />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-900/60 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-brand-500/40"
              >
                <Pencil className="h-4 w-4 text-brand-400" /> Edit profile
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Profile summary" className="mb-4" />
            <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg text-white">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <ProfileRow icon={<UserCircle2 className="h-4 w-4" />} label="Phone" value={user.phone || 'Not added'} />
              <ProfileRow icon={<ShieldCheck className="h-4 w-4" />} label="Account type" value={user.role === 'admin' ? 'Administrator' : 'Customer'} />
              <ProfileRow icon={<CalendarDays className="h-4 w-4" />} label="Member since" value={formatDateTime(user.createdAt)} />
            </div>
          </Card>
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} onSubmit={updateProfile} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl tracking-wide text-white sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-900/60 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-brand-500/40"
    >
      <span className="text-brand-400">{icon}</span>
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
    </Link>
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) reset({ name: user.name, phone: user.phone ?? '' });
  }, [open, user.name, user.phone, reset]);

  const submit = async (values: ProfileValues) => {
    setSaving(true);
    try {
      await onSubmit(values);
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'summary'] });
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
