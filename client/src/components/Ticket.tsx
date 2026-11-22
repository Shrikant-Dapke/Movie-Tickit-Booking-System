import { Download, Printer, Ticket as TicketIcon } from 'lucide-react';
import type { TicketData } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency, formatLongDate, formatTime12 } from '@/lib/utils';
import { downloadHtmlFile } from '@/lib/download';

export function Ticket({
  data,
  actions = true,
  className,
}: {
  data: TicketData;
  actions?: boolean;
  className?: string;
}) {
  const { booking, qrDataUrl, downloadHtml } = data;
  const show = booking.show;

  const handleDownload = () => {
    downloadHtmlFile(downloadHtml, `CineBook-Ticket-${booking.code}.html`);
  };

  return (
    <div className={cn('ticket-doc print-area overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl', className)}>
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-500 to-brand-600 px-6 py-5">
        <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full border-[14px] border-white/10" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TicketIcon className="h-7 w-7 text-white" aria-hidden="true" />
            <div>
              <p className="font-display text-3xl leading-none tracking-wide text-white">CINEBOOK</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">Digital ticket</p>
            </div>
          </div>
          <Badge className="border-white/30 bg-white/15 text-white" tone="neutral">
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <TicketField label="Booking ID" value={booking.code} highlight />
          <TicketField label="Booking status" value={`${booking.status} · ${booking.paymentStatus}`} />
          <TicketField label="Movie" value={show?.movie?.title ?? '—'} />
          <TicketField label="Format" value={show?.format ?? '—'} />
          <TicketField label="Theatre" value={show?.theatre?.name ?? '—'} sub={show?.theatre?.city} />
          <TicketField label="Screen" value={show?.screen?.name ?? '—'} />
          <TicketField label="Show date" value={formatLongDate(show?.date)} />
          <TicketField label="Show time" value={formatTime12(show?.time)} />
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Seats</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {booking.seats.map((seat) => (
                <span
                  key={seat.label}
                  className="rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1 text-xs font-semibold text-slate-200"
                >
                  {seat.label} <span className="font-normal text-slate-500">· {seat.category}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="h-px w-full border-t border-dashed border-white/15" />
            <div className="mt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(booking.amount)} />
              {Number(booking.discount) > 0 && (
                <Row label="Discount" value={`− ${formatCurrency(booking.discount)}`} accent />
              )}
              <Row label="Amount paid" value={formatCurrency(booking.total)} bold />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-start gap-3 border-white/10 sm:border-l sm:pl-6">
          <div className="rounded-xl bg-white p-3 shadow-lg">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code for booking ${booking.code}`} className="h-32 w-32 object-contain" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center text-center text-xs text-slate-400">
                QR unavailable
              </div>
            )}
          </div>
          <p className="max-w-[150px] text-center text-[11px] leading-relaxed text-slate-500">
            Scan at the theatre entrance. This ticket is a simulation.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-ink-850 px-6 py-4 text-[11px] text-slate-500">
        <span>Issued {new Date(booking.createdAt).toLocaleString('en-IN')}</span>
        <span className="brand-print font-semibold text-brand-500">CineBook · Enjoy the show</span>
      </div>

      {actions && (
        <div className="no-print flex flex-wrap gap-3 border-t border-white/[0.07] bg-ink-900 p-4">
          <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
            Print ticket
          </Button>
          <Button variant="outline" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
            Download HTML
          </Button>
        </div>
      )}
    </div>
  );
}

function TicketField({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold', highlight ? 'font-display text-xl tracking-wide text-brand-400' : 'text-slate-100')}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className={cn('font-semibold', bold ? 'text-white' : 'text-slate-300', accent && 'text-emerald-400')}>
        {value}
      </span>
    </div>
  );
}
