import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionTo,
  onAction,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}) {
  const action = actionLabel ? (
    actionTo ? (
      <Link
        to={actionTo}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition hover:gap-2.5 hover:text-brand-300"
      >
        {actionLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    ) : (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition hover:gap-2.5 hover:text-brand-300"
      >
        {actionLabel} <ArrowRight className="h-4 w-4" />
      </button>
    )
  ) : null;

  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">{eyebrow}</p>
        )}
        <h2 className="font-display text-3xl tracking-wide text-white sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
