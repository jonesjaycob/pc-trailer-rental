import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, auditLogs } from "@/lib/db/schema";
import { getSettings } from "@/lib/bookings";
import { calculateRefund } from "@/lib/cancellation";
import { stripe } from "@/lib/stripe";
import { parseDateOnly } from "@/lib/availability";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUserApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (b.userId !== guard.user.id && guard.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (b.status === "cancelled" || b.status === "completed") {
    return NextResponse.json({ error: `Booking is already ${b.status}` }, { status: 400 });
  }

  const s = await getSettings();
  const pickupAt = parseDateOnly(b.startDate);
  const refund = calculateRefund({
    totalCents: b.totalCents,
    pickupAt,
    policy: s.cancellationPolicyJson,
  });

  // Issue refund on the rental Payment Intent if it was captured.
  if (b.stripePaymentIntentId && refund.refundCents > 0 && process.env.STRIPE_SECRET_KEY) {
    try {
      await stripe.refunds.create({
        payment_intent: b.stripePaymentIntentId,
        amount: refund.refundCents,
        reason: "requested_by_customer",
      });
    } catch (err) {
      console.error("[cancel] refund failed", err);
    }
  }

  // Release deposit authorization (manual-capture PI).
  if (b.stripeDepositIntentId && process.env.STRIPE_SECRET_KEY) {
    try {
      await stripe.paymentIntents.cancel(b.stripeDepositIntentId);
    } catch (err) {
      console.error("[cancel] deposit release failed", err);
    }
  }

  await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: guard.user.role === "admin" ? "cancelled by admin" : "cancelled by customer",
    })
    .where(eq(bookings.id, id));

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "booking.cancelled",
    entityType: "booking",
    entityId: id,
    metadata: { refund },
  });

  return NextResponse.json({ ok: true, refund });
}
