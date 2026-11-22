import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-900/70 p-1 no-scrollbar', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-brand-500 text-white shadow-[0_6px_18px_-8px_rgba(229,9,20,0.9)]'
              : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', active === tab.id ? 'bg-white/20' : 'bg-white/[0.07]')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
