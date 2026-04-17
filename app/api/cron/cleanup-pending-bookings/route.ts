import { NextResponse } from "next/server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, auditLogs } from "@/lib/db/schema";

/**
 * Releases pending bookings that haven't moved to Stripe within 30 minutes —
 * this frees up the held dates for someone else. Call from Vercel Cron or an
 * external scheduler.
 *
 * Auth: requires header `x-cron-secret` matching env `CRON_SECRET`, OR the
 * Vercel Cron `authorization: Bearer <CRON_SECRET>` convention.
 */
const TTL_MINUTES = 30;

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-cron-secret");
  if (header === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return false;
}

async function run() {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000);
  const stale = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "pending"),
        isNull(bookings.stripePaymentIntentId),
        lt(bookings.createdAt, cutoff)
      )
    );

  if (stale.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  for (const row of stale) {
    await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "abandoned_before_payment",
      })
      .where(eq(bookings.id, row.id));

    await db.insert(auditLogs).values({
      action: "booking.cleanup_abandoned",
      entityType: "booking",
      entityId: row.id,
      metadata: { ttlMinutes: TTL_MINUTES },
    });
  }

  return NextResponse.json({ cleaned: stale.length });
}
