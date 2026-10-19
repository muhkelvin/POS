/**
 * Format number to Indonesian Rupiah representation: Rp 125.000
 * No decimals, dot as thousand separator.
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return rounded < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format date in Asia/Jakarta timezone
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(date);
}

/**
 * Format datetime in Asia/Jakarta timezone: e.g. 20 Okt 2026, 14:30 WIB
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const datePart = formatDate(date, { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart}, ${timePart} WIB`;
}

/**
 * Format time only in Asia/Jakarta: 14:30:15 WIB
 */
export function formatTimeJakarta(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format date for header: Selasa, 20 Oktober 2026
 */
export function formatHeaderDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
