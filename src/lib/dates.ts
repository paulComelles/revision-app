export const DAY_MS = 86_400_000;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isWeekend(t: number): boolean {
  const d = new Date(t).getDay();
  return d === 0 || d === 6;
}

/** Days from `now` to a YYYY-MM-DD date (local), rounded up; negative if past. */
export function daysUntil(dateStr: string, now: number): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
  return Math.ceil((target - startOfDay(now)) / DAY_MS);
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Monday 00:00 of the week containing t */
export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function formatDateFr(t: number): string {
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
}
