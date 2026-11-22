import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'red' | 'green' | 'amber' | 'blue' | 'purple';

const TONES: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/[0.06] text-slate-300',
  red: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  purple: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
