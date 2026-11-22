import { useMemo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import type { SeatCategory, SeatState } from '@/types/api';

interface SeatMapProps {
  seats: SeatState[];
  categories: SeatCategory[];
  selected: string[];
  onToggle: (label: string) => void;
  maxSeats?: number;
}

type RowGroup = [string, SeatState[]];

function compareRows(a: string, b: string): number {
  const numericA = Number(a);
  const numericB = Number(b);
  if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) return numericA - numericB;
  return a.localeCompare(b, undefined, { numeric: true });
}

export function SeatMap({ seats, categories, selected, onToggle, maxSeats = 8 }: SeatMapProps) {
  const rowGroups = useMemo<RowGroup[]>(() => {
    const map = new Map<string, SeatState[]>();
    for (const seat of seats) {
      const key = String(seat.row);
      const list = map.get(key) ?? [];
      list.push(seat);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([key, list]) => [key, [...list].sort((a, b) => a.number - b.number)] as RowGroup)
      .sort((a, b) => compareRows(a[0], b[0]));
  }, [seats]);

  const categoryGroups = useMemo(() => {
    const byCategory = new Map<string, RowGroup[]>();
    for (const group of rowGroups) {
      const category = group[1][0]?.category || 'Standard';
      const list = byCategory.get(category) ?? [];
      list.push(group);
      byCategory.set(category, list);
    }
    const names = categories.map((category) => category.name);
    const ordered = [
      ...names.filter((name) => byCategory.has(name)),
      ...[...byCategory.keys()].filter((name) => !names.includes(name)),
    ];
    return ordered.map((name) => ({
      name,
      rows: byCategory.get(name) ?? [],
      price:
        categories.find((category) => category.name === name)?.basePrice ??
        byCategory.get(name)?.[0]?.[1][0]?.price ??
        0,
    }));
  }, [categories, rowGroups]);

  if (!seats.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
        No seating plan is available for this show.
      </div>
    );
  }

  return (
    <div className="scrollbar-thin overflow-x-auto pb-3">
      <div className="mx-auto w-max min-w-full px-2">
        {/* Screen indicator */}
        <div className="mb-8 mt-2 flex flex-col items-center">
          <div className="h-8 w-2/3 min-w-[280px] rounded-t-[100%] border-t-[3px] border-brand-500/50 bg-gradient-to-b from-brand-500/10 to-transparent" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            All eyes this way
          </p>
        </div>

        <div className="space-y-7">
          {categoryGroups.map((group) => (
            <div key={group.name}>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden="true" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-200">{group.name}</h3>
                <span className="text-xs font-semibold text-emerald-400">{formatCurrency(group.price)}</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <div className="space-y-1.5">
                {group.rows.map(([rowKey, rowSeats]) => {
                  const aisleAfter = Math.floor(rowSeats.length / 2) - 1;
                  return (
                    <div key={rowKey} className="flex items-center justify-center gap-1.5">
                      <span className="w-6 shrink-0 text-right text-[11px] font-bold text-slate-600">{rowKey}</span>
                      <div className="flex items-center gap-1.5">
                        {rowSeats.map((seat, index) => {
                          const isSelected = selected.includes(seat.label);
                          const locked = seat.status === 'booked' || (seat.status === 'held' && !seat.mine);
                          const atLimit = !isSelected && selected.length >= maxSeats;
                          const disabled = locked || atLimit;

                          const tone = isSelected
                            ? 'border-brand-500 bg-brand-500 text-white shadow-[0_0_16px_-2px_rgba(229,9,20,0.8)]'
                            : seat.mine
                              ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
                              : seat.status === 'held'
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                                : seat.status === 'booked'
                                  ? 'cursor-not-allowed border-ink-700 bg-ink-800/60 text-slate-700'
                                  : 'border-white/15 bg-ink-700/70 text-slate-300 hover:-translate-y-0.5 hover:border-brand-400 hover:text-white';

                          const statusLabel = isSelected
                            ? 'selected'
                            : seat.mine
                              ? 'your hold'
                              : seat.status;

                          return (
                            <div key={seat.label ?? `${seat.row}-${seat.number}`} className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={disabled}
                                aria-pressed={isSelected}
                                aria-label={`Seat ${seat.label}, ${seat.category}, ${formatCurrency(seat.price)}, ${statusLabel}`}
                                onClick={() => onToggle(seat.label)}
                                className={cn('seat', tone, disabled && !locked && 'cursor-not-allowed opacity-40')}
                                title={`${seat.label} · ${formatCurrency(seat.price)}`}
                              >
                                {seat.number}
                              </button>
                              {index === aisleAfter && <span className="w-5 shrink-0 sm:w-7" aria-hidden="true" />}
                            </div>
                          );
                        })}
                      </div>
                      <span className="w-6 shrink-0 text-left text-[11px] font-bold text-slate-600">{rowKey}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items = [
    { label: 'Available', className: 'border-white/15 bg-ink-700' },
    { label: 'Selected', className: 'border-brand-500 bg-brand-500' },
    { label: 'Your hold', className: 'border-emerald-400/70 bg-emerald-500/20' },
    { label: 'On hold', className: 'border-amber-500/50 bg-amber-500/20' },
    { label: 'Booked', className: 'border-ink-700 bg-ink-800 opacity-60' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs text-slate-400">
          <span className={cn('h-4 w-4 rounded-t-md border', item.className)} aria-hidden="true" />
          {item.label}
        </div>
      ))}
    </div>
  );
}
