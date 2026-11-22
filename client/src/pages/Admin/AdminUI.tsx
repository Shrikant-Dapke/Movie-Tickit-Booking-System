import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BookingStatus } from '@/types/api';

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-3xl tracking-wide text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field-base h-10 pl-9"
      />
    </div>
  );
}

export function AdminTable({ children, headers }: { children: ReactNode; headers: string[] }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-ink-800/70 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus | string }) {
  const tone =
    status === 'confirmed' ? 'green' : status === 'pending' ? 'amber' : status === 'failed' || status === 'cancelled' ? 'red' : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}

export function MetricSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500/50 hover:text-white disabled:opacity-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="rounded-lg border border-brand-500/20 px-2.5 py-1.5 text-xs font-medium text-brand-300 transition hover:bg-brand-500/10 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
