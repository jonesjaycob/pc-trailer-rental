import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, auditLogs } from "@/lib/db/schema";
import { bookingActionSchema } from "@/lib/validators/admin";
import { stripe } from "@/lib/stripe";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  approve: ["pending"],
  mark_picked_up: ["confirmed"],
  mark_returned: ["active"],
  capture_deposit: ["active", "completed"],
  release_deposit: ["active", "completed", "cancelled"],
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bookingActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action", details: parsed.error.flatten() }, { status: 400 });
  }

  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedFrom = STATUS_TRANSITIONS[parsed.data.action];
  if (!allowedFrom.includes(b.status)) {
    return NextResponse.json(
      { error: `Cannot ${parsed.data.action} a booking with status ${b.status}` },
      { status: 400 }
    );
  }

  switch (parsed.data.action) {
    case "approve":
      await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, id));
      break;

    case "mark_picked_up":
      await db.update(bookings).set({ status: "active" }).where(eq(bookings.id, id));
      break;

    case "mark_returned":
      await db.update(bookings).set({ status: "completed" }).where(eq(bookings.id, id));
      break;

    case "capture_deposit": {
      if (!b.stripeDepositIntentId) {
        return NextResponse.json({ error: "No deposit intent on file" }, { status: 400 });
      }
      if (parsed.data.amountCents > b.depositCents) {
        return NextResponse.json(
          { error: "Amount exceeds authorized deposit" },
          { status: 400 }
        );
      }
      try {
        await stripe.paymentIntents.capture(b.stripeDepositIntentId, {
          amount_to_capture: parsed.data.amountCents,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Capture failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
      break;
    }

    case "release_deposit": {
      if (!b.stripeDepositIntentId) {
        return NextResponse.json({ error: "No deposit intent on file" }, { status: 400 });
      }
      try {
        await stripe.paymentIntents.cancel(b.stripeDepositIntentId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Release failed";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
      break;
    }
  }

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: `booking.${parsed.data.action}`,
    entityType: "booking",
    entityId: id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
