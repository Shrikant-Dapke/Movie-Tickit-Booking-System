/** Tiny helpers shared across the app. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | undefined | null): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  // Mongoose serialises Date fields as ISO strings; show dates are plain
  // YYYY-MM-DD. Handle both without producing "Invalid Date" or raw ISO text.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLongDate(value?: string): string {
  return formatDate(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime24(time?: string): string {
  return time || '—';
}

export function formatTime12(time?: string): string {
  if (!time) return '—';
  const [hours = '0', minutes = '0'] = time.split(':');
  const h = Number(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${minutes} ${suffix}`;
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Accept either a full YouTube URL, youtu.be link, or a bare video id. */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toCsv(value?: string[]): string {
  return (value ?? []).join(', ');
}

export function isFutureShow(date?: string, time?: string): boolean {
  if (!date) return false;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time ?? '00:00').split(':').map(Number);
  const showTime = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).getTime();
  return showTime >= Date.now();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
