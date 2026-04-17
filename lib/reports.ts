import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers } from "@/lib/db/schema";

export type ReportsWindow = { startIso: string; endIso: string; days: number };

export function defaultWindow(): ReportsWindow {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const days =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return {
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    days,
  };
}

export async function getSummary(window: ReportsWindow) {
  const [summary] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.totalCents}), 0)::int`,
      avgCents: sql<number>`coalesce(round(avg(${bookings.totalCents}))::int, 0)`,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.startDate, window.startIso),
        lte(bookings.startDate, window.endIso),
        inArray(bookings.status, ["confirmed", "active", "completed"])
      )
    );

  return summary;
}

export async function getTrailerUtilization(window: ReportsWindow) {
  // Booked-nights per trailer over the window, excluding cancelled.
  const rows = await db
    .select({
      trailerId: trailers.id,
      trailerName: trailers.name,
      bookedNights: sql<number>`coalesce(sum(
        greatest(0,
          least(${bookings.endDate}::date, ${window.endIso}::date)
          - greatest(${bookings.startDate}::date, ${window.startIso}::date)
        )
      ), 0)::int`,
      revenue: sql<number>`coalesce(sum(${bookings.totalCents}), 0)::int`,
    })
    .from(trailers)
    .leftJoin(
      bookings,
      and(
        eq(bookings.trailerId, trailers.id),
        inArray(bookings.status, ["confirmed", "active", "completed"]),
        lte(bookings.startDate, window.endIso),
        gte(bookings.endDate, window.startIso)
      )
    )
    .where(eq(trailers.status, "active"))
    .groupBy(trailers.id, trailers.name);

  return rows.map((r) => ({
    ...r,
    utilizationPct: window.days > 0 ? Math.round((r.bookedNights / window.days) * 100) : 0,
  }));
}
