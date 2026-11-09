/**
 * Local-day helpers. This is the single place that decides "what day is it".
 * A day is a `YYYY-MM-DD` string in the device's local time zone; it flips at
 * local midnight.
 */

export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of a timestamp (ms since epoch) or Date. */
export function toDayKey(time: number | Date): DayKey {
  const d = typeof time === 'number' ? new Date(time) : time;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local day. */
export function today(now: number = Date.now()): DayKey {
  return toDayKey(now);
}

function parseDayKey(day: DayKey): { y: number; m: number; d: number } {
  const [y, m, d] = day.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined || [y, m, d].some(Number.isNaN)) {
    throw new Error(`Invalid day key: ${day}`);
  }
  return { y, m, d };
}

/** Shift a day by `n` calendar days. Uses local noon, so DST shifts never skip a day. */
export function addDays(day: DayKey, n: number): DayKey {
  const { y, m, d } = parseDayKey(day);
  return toDayKey(new Date(y, m - 1, d + n, 12));
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: DayKey, b: DayKey): number {
  const pa = parseDayKey(a);
  const pb = parseDayKey(b);
  const utcA = Date.UTC(pa.y, pa.m - 1, pa.d);
  const utcB = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((utcB - utcA) / 86_400_000);
}

/** Milliseconds until the next local midnight (always > 0). */
export function msUntilNextDay(now: number = Date.now()): number {
  const d = new Date(now);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1, next.getTime() - now);
}
