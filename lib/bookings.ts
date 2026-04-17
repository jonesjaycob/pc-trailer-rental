import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, maintenanceBlocks, trailers, settings } from "@/lib/db/schema";
import { calculatePricing } from "@/lib/pricing";
import { parseDateOnly, withBuffer } from "@/lib/availability";

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "active"] as const;

export async function getSettings() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (!row) throw new Error("Settings row missing — run `npm run db:seed`");
  return row;
}

export async function getTrailerById(trailerId: string) {
  const [t] = await db.select().from(trailers).where(eq(trailers.id, trailerId)).limit(1);
  return t ?? null;
}

/**
 * Returns all blocking date ranges for a trailer: active bookings + maintenance
 * blocks. Caller applies buffer when checking.
 */
export async function getTrailerBlockers(trailerId: string) {
  const [bRows, mRows] = await Promise.all([
    db
      .select({ start: bookings.startDate, end: bookings.endDate })
      .from(bookings)
      .where(
        and(
          eq(bookings.trailerId, trailerId),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES])
        )
      ),
    db
      .select({ start: maintenanceBlocks.startDate, end: maintenanceBlocks.endDate })
      .from(maintenanceBlocks)
      .where(eq(maintenanceBlocks.trailerId, trailerId)),
  ]);

  const ranges = [...bRows, ...mRows].map((r) => ({
    start: parseDateOnly(r.start),
    end: parseDateOnly(r.end),
  }));

  return ranges;
}

/**
 * Returns the set of individual dates (YYYY-MM-DD) a trailer is unavailable
 * within [windowStart, windowEnd). Used by the date picker to disable dates.
 */
export async function getUnavailableDates(
  trailerId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<string[]> {
  const trailer = await getTrailerById(trailerId);
  if (!trailer) return [];

  const blockers = await getTrailerBlockers(trailerId);
  const buffered = blockers.map((b) => withBuffer(b, trailer.bufferHours));
  const set = new Set<string>();

  for (
    let d = new Date(windowStart);
    d < windowEnd;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const overlap = buffered.some((b) => b.start < dayEnd && dayStart < b.end);
    if (overlap) set.add(dayStart.toISOString().slice(0, 10));
  }

  return Array.from(set).sort();
}

/**
 * Checks availability for a specific range. Returns reason if unavailable.
 */
export async function checkRangeAvailable(
  trailerId: string,
  start: Date,
  end: Date
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const trailer = await getTrailerById(trailerId);
  if (!trailer) return { ok: false, reason: "Trailer not found" };
  if (trailer.status !== "active")
    return { ok: false, reason: "This trailer is not available for booking" };
  if (end <= start) return { ok: false, reason: "End date must be after start date" };

  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < trailer.minRentalDays) {
    return {
      ok: false,
      reason: `Minimum rental is ${trailer.minRentalDays} day(s) for this trailer`,
    };
  }

  const blockers = await getTrailerBlockers(trailerId);
  const buffered = blockers.map((b) => withBuffer(b, trailer.bufferHours));
  const overlap = buffered.some((b) => start < b.end && b.start < end);
  if (overlap) return { ok: false, reason: "Those dates are already booked" };

  return { ok: true };
}

export type CreateBookingInput = {
  userId: string;
  trailerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pickupTime?: string;
  returnTime?: string;
};

/**
 * Creates a draft booking row (status 'pending'). The DB-level exclusion
 * constraint prevents overlap with other pending/confirmed/active bookings.
 * If the constraint fires, we catch and return a clear error.
 */
export async function createDraftBooking(input: CreateBookingInput) {
  const trailer = await getTrailerById(input.trailerId);
  if (!trailer) return { ok: false as const, error: "Trailer not found" };

  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);
  const avail = await checkRangeAvailable(input.trailerId, start, end);
  if (!avail.ok) return { ok: false as const, error: avail.reason };

  const s = await getSettings();
  const pricing = calculatePricing({
    trailer,
    start,
    end,
    taxRateBps: s.taxRateBps,
  });

  try {
    const [row] = await db
      .insert(bookings)
      .values({
        userId: input.userId,
        trailerId: input.trailerId,
        startDate: input.startDate,
        endDate: input.endDate,
        pickupTime: input.pickupTime,
        returnTime: input.returnTime,
        pricingBreakdown: pricing,
        subtotalCents: pricing.subtotalCents,
        taxCents: pricing.taxCents,
        totalCents: pricing.totalCents,
        depositCents: pricing.depositCents,
        status: "pending",
      })
      .returning();
    return { ok: true as const, booking: row, pricing };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("booking_no_overlap")) {
      return { ok: false as const, error: "Those dates were just taken. Please pick different dates." };
    }
    throw err;
  }
}

