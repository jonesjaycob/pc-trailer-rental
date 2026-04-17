import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, trailers, users, auditLogs } from "@/lib/db/schema";
import { finalizeBookingSchema } from "@/lib/validators/booking";
import { uploadBlob } from "@/lib/blob";
import { generateRentalAgreementPdf } from "@/lib/pdf";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { checkRangeAvailable } from "@/lib/bookings";
import { parseDateOnly } from "@/lib/availability";

/**
 * Finalizes a pending booking:
 * 1. Validates the user is 21+.
 * 2. Re-verifies availability server-side (defense in depth).
 * 3. Uploads the signature PNG to Blob.
 * 4. Generates the rental agreement PDF and uploads to Blob.
 * 5. Creates (or reuses) a Stripe Customer for the user.
 * 6. Creates two Payment Intents:
 *      - Rental fee: automatic capture.
 *      - Security deposit: manual capture (hold only).
 *    Both use `automatic_payment_methods` + a shared `payment_method` after
 *    the client confirms the rental PI on the front end. The front end
 *    confirms the rental PI first; the webhook confirms the deposit PI.
 * 7. Returns the two client secrets.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUserApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = finalizeBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (b.userId !== guard.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (b.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot finalize a booking with status ${b.status}` },
      { status: 400 }
    );
  }

  // Age check
  const dob = new Date(parsed.data.dob);
  const ageYears = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 21) {
    return NextResponse.json({ error: "Renters must be at least 21 years old." }, { status: 400 });
  }

  // Defense in depth — re-check availability at finalize time.
  const avail = await checkRangeAvailable(b.trailerId, parseDateOnly(b.startDate), parseDateOnly(b.endDate));
  if (!avail.ok) {
    return NextResponse.json({ error: avail.reason }, { status: 409 });
  }

  const [trailer] = await db.select().from(trailers).where(eq(trailers.id, b.trailerId)).limit(1);
  const [user] = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
  if (!trailer || !user) {
    return NextResponse.json({ error: "Missing related records" }, { status: 500 });
  }

  // Upload signature
  const sigBase64 = parsed.data.signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const sigBytes = Buffer.from(sigBase64, "base64");
  const sigUpload = await uploadBlob(
    `signatures/${user.id}/${id}.png`,
    sigBytes,
    { contentType: "image/png" }
  );

  // Generate PDF
  const pdfBytes = await generateRentalAgreementPdf({
    booking: b,
    trailer,
    user: {
      ...user,
      phone: parsed.data.phone,
      dob: parsed.data.dob,
      driversLicenseUrl: parsed.data.driversLicenseUrl,
    },
    signaturePngBytes: sigBytes,
  });
  const pdfUpload = await uploadBlob(
    `agreements/${user.id}/${id}.pdf`,
    Buffer.from(pdfBytes),
    { contentType: "application/pdf" }
  );

  // Update user profile
  await db
    .update(users)
    .set({
      phone: parsed.data.phone,
      dob: parsed.data.dob,
      driversLicenseUrl: parsed.data.driversLicenseUrl,
    })
    .where(eq(users.id, user.id));

  // Stripe setup
  assertStripeConfigured();

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      phone: parsed.data.phone,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await db.update(users).set({ stripeCustomerId }).where(eq(users.id, user.id));
  }

  // Rental fee PaymentIntent (auto capture)
  const rentalPi = await stripe.paymentIntents.create({
    amount: b.totalCents,
    currency: "usd",
    customer: stripeCustomerId,
    capture_method: "automatic",
    automatic_payment_methods: { enabled: true },
    description: `Rental: ${trailer.name} (${b.startDate} - ${b.endDate})`,
    metadata: { bookingId: b.id, type: "rental" },
  });

  // Deposit PaymentIntent (manual capture = hold only)
  const depositPi = await stripe.paymentIntents.create({
    amount: b.depositCents,
    currency: "usd",
    customer: stripeCustomerId,
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    description: `Security deposit (hold): ${trailer.name}`,
    metadata: { bookingId: b.id, type: "deposit" },
  });

  await db
    .update(bookings)
    .set({
      stripePaymentIntentId: rentalPi.id,
      stripeDepositIntentId: depositPi.id,
      rentalAgreementUrl: pdfUpload.url,
      signatureUrl: sigUpload.url,
    })
    .where(eq(bookings.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "booking.finalized",
    entityType: "booking",
    entityId: id,
    metadata: { rentalPi: rentalPi.id, depositPi: depositPi.id },
  });

  return NextResponse.json({
    bookingId: id,
    rentalPaymentIntent: {
      id: rentalPi.id,
      clientSecret: rentalPi.client_secret,
      amount: rentalPi.amount,
    },
    depositPaymentIntent: {
      id: depositPi.id,
      clientSecret: depositPi.client_secret,
      amount: depositPi.amount,
    },
    rentalAgreementUrl: pdfUpload.url,
  });
}
