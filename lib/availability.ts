/**
 * Availability helpers. Bookings use half-open date ranges: [startDate, endDate).
 * A trailer is unavailable on a date D if any confirmed/active/pending booking
 * covers D, OR any maintenance block covers D, OR D falls within the buffer
 * window after a booking's end.
 */

export type DateRange = { start: Date; end: Date };

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Extend a booking range forward by bufferHours to block same-day re-rentals.
 */
export function withBuffer(range: DateRange, bufferHours: number): DateRange {
  return {
    start: range.start,
    end: new Date(range.end.getTime() + bufferHours * 60 * 60 * 1000),
  };
}

export function isRangeAvailable(
  candidate: DateRange,
  blockers: DateRange[],
  bufferHours: number
): boolean {
  return !blockers.some((b) => rangesOverlap(candidate, withBuffer(b, bufferHours)));
}

export function parseDateOnly(s: string): Date {
  // YYYY-MM-DD → UTC midnight
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
