import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, damageClaims, auditLogs } from "@/lib/db/schema";
import { damageClaimSchema } from "@/lib/validators/pricing";
import { stripe, assertStripeConfigured } from "@/lib/stripe";

/**
 * Creates a damage claim and captures the total against the deposit PI.
 * Caller supplies line items; server re-sums them. The amount captured is
 * exactly the line-item total — never trust a client-supplied total.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = damageClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!b.stripeDepositIntentId) {
    return NextResponse.json(
      { error: "No deposit on file for this booking" },
      { status: 400 }
    );
  }

  const totalCents = parsed.data.lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  if (totalCents > b.depositCents) {
    return NextResponse.json(
      { error: `Claim ($${(totalCents / 100).toFixed(2)}) exceeds authorized deposit` },
      { status: 400 }
    );
  }

  // Capture partial amount from the deposit hold
  assertStripeConfigured();
  let capturedPiId: string | null = null;
  try {
    const pi = await stripe.paymentIntents.capture(b.stripeDepositIntentId, {
      amount_to_capture: totalCents,
    });
    capturedPiId = pi.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const [claim] = await db
    .insert(damageClaims)
    .values({
      bookingId: id,
      lineItems: parsed.data.lineItems,
      totalCents,
      notes: parsed.data.notes,
      capturedPaymentIntentId: capturedPiId,
      createdByUserId: guard.user.id,
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "damage_claim.created",
    entityType: "booking",
    entityId: id,
    metadata: { claimId: claim.id, totalCents, lineItems: parsed.data.lineItems },
  });

  return NextResponse.json({ claim }, { status: 201 });
}
