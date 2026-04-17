import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users, auditLogs } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handleRentalSucceeded(pi);
        break;
      }
      case "payment_intent.amount_capturable_updated": {
        // Deposit PI authorized (manual capture hold is in place)
        const pi = event.data.object as Stripe.PaymentIntent;
        await handleDepositAuthorized(pi);
        break;
      }
      case "payment_intent.canceled":
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] ${event.type} failed`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function findBookingByPi(piId: string) {
  const [byRental] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.stripePaymentIntentId, piId))
    .limit(1);
  if (byRental) return { booking: byRental, kind: "rental" as const };

  const [byDeposit] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.stripeDepositIntentId, piId))
    .limit(1);
  if (byDeposit) return { booking: byDeposit, kind: "deposit" as const };

  return null;
}

async function handleRentalSucceeded(pi: Stripe.PaymentIntent) {
  const metaBookingId = pi.metadata?.bookingId;
  const type = pi.metadata?.type;
  if (type !== "rental" || !metaBookingId) return;

  const [b] = await db.select().from(bookings).where(eq(bookings.id, metaBookingId)).limit(1);
  if (!b || b.status === "confirmed" || b.status === "active" || b.status === "completed") return;

  await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, metaBookingId));
  await db.insert(auditLogs).values({
    action: "booking.confirmed",
    entityType: "booking",
    entityId: metaBookingId,
    metadata: { paymentIntent: pi.id },
  });

  // Send confirmation email (best-effort)
  const [trailer] = await db.select().from(trailers).where(eq(trailers.id, b.trailerId)).limit(1);
  const [user] = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
  if (trailer && user?.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: `Your rental is confirmed — ${trailer.name}`,
        react: BookingConfirmationEmail({ booking: b, trailer, user }),
      });
    } catch (err) {
      console.error("[webhook] confirmation email failed", err);
    }
  }
}

async function handleDepositAuthorized(pi: Stripe.PaymentIntent) {
  const type = pi.metadata?.type;
  if (type !== "deposit") return;
  const bookingId = pi.metadata?.bookingId;
  if (!bookingId) return;

  await db.insert(auditLogs).values({
    action: "booking.deposit_authorized",
    entityType: "booking",
    entityId: bookingId,
    metadata: { paymentIntent: pi.id, amount: pi.amount },
  });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const res = await findBookingByPi(pi.id);
  if (!res) return;
  await db.insert(auditLogs).values({
    action: "booking.payment_failed",
    entityType: "booking",
    entityId: res.booking.id,
    metadata: { paymentIntent: pi.id, kind: res.kind, status: pi.status },
  });
}
