import QRCode from 'qrcode';

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const buildTicket = async (booking: Record<string, any>) => {
  const show = booking.show ?? {};
  const movie = show.movie ?? {};
  const theatre = show.theatre ?? {};
  const screen = show.screen ?? {};
  const movieTitle = movie.title ?? 'CineBook Movie';
  const payload = JSON.stringify({
    code: booking.code,
    movie: movieTitle,
    theatre: theatre.name,
    screen: screen.name,
    date: show.date,
    time: show.time,
    seats: (booking.seats ?? []).map((seat: { label: string }) => seat.label),
  });
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 260, margin: 1, color: { dark: '#08090c', light: '#ffffff' } });

  const rows = (booking.seats ?? [])
    .map((seat: { label: string; category: string; price: number }) =>
      `<tr><td>${escapeHtml(seat.label)}</td><td>${escapeHtml(seat.category)}</td><td>₹${escapeHtml(seat.price)}</td></tr>`,
    )
    .join('');

  const downloadHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>CineBook Ticket ${escapeHtml(booking.code)}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#08090c;color:#f4f4f5;margin:0;padding:40px;display:flex;justify-content:center}
  .ticket{width:420px;background:#12151c;border:1px solid #242a36;border-top:5px solid #e50914;border-radius:14px;padding:28px}
  h1{font-family:Impact,sans-serif;letter-spacing:2px;margin:0;font-size:34px} h1 span{color:#e50914}
  h2{margin:20px 0 6px;font-size:22px} .muted{color:#a1a1aa;font-size:13px} .row{display:flex;justify-content:space-between;margin:8px 0}
  table{width:100%;border-collapse:collapse;margin-top:16px} td,th{text-align:left;padding:6px 0;border-bottom:1px solid #242a36;font-size:13px}
  .qr{display:block;margin:24px auto 8px;width:200px;height:200px;background:#fff;padding:8px;border-radius:8px}
  .total{font-size:20px;font-weight:700;color:#e50914;text-align:right;margin-top:16px}
  .foot{text-align:center;color:#71717a;font-size:11px;margin-top:24px}
</style></head><body><div class="ticket">
  <h1>CINE<span>BOOK</span></h1><p class="muted">DIGITAL TICKET · ${escapeHtml(booking.code)}</p>
  <h2>${escapeHtml(movieTitle)}</h2>
  <div class="row"><span class="muted">Theatre</span><b>${escapeHtml(theatre.name)}</b></div>
  <div class="row"><span class="muted">City</span><b>${escapeHtml(theatre.city)}</b></div>
  <div class="row"><span class="muted">Screen / Format</span><b>${escapeHtml(screen.name)} · ${escapeHtml(show.format)}</b></div>
  <div class="row"><span class="muted">Date & Time</span><b>${escapeHtml(show.date)} · ${escapeHtml(show.time)}</b></div>
  <table><thead><tr><th>Seat</th><th>Category</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="total">Total ₹${escapeHtml(booking.total)}</div>
  <img class="qr" src="${qrDataUrl}" alt="Ticket QR code" />
  <div class="foot">Status: ${escapeHtml(booking.status)} · Simulated payment demo · CineBook</div>
</div></body></html>`;

  return { qrDataUrl, downloadHtml };
};
