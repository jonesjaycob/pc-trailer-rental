import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, inspections, auditLogs } from "@/lib/db/schema";
import { inspectionSchema } from "@/lib/validators/admin";
import { uploadBlob } from "@/lib/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = inspectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const requiredStatus = parsed.data.type === "pickup" ? "confirmed" : "active";
  if (b.status !== requiredStatus) {
    return NextResponse.json(
      { error: `Inspection can only be recorded when booking is ${requiredStatus}` },
      { status: 400 }
    );
  }

  // Ensure only one inspection of each type per booking
  const [existing] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.bookingId, id), eq(inspections.type, parsed.data.type)))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: `${parsed.data.type} inspection already recorded` },
      { status: 409 }
    );
  }

  // Upload signature if provided
  let signatureUrl: string | undefined;
  if (parsed.data.signatureDataUrl) {
    const base64 = parsed.data.signatureDataUrl.replace(/^data:image\/png;base64,/, "");
    const bytes = Buffer.from(base64, "base64");
    const upload = await uploadBlob(
      `inspections/${id}/${parsed.data.type}-signature.png`,
      bytes,
      { contentType: "image/png" }
    );
    signatureUrl = upload.url;
  }

  const [row] = await db
    .insert(inspections)
    .values({
      bookingId: id,
      type: parsed.data.type,
      mileageOrHours: parsed.data.mileageOrHours,
      fuelLevel: parsed.data.fuelLevel,
      notes: parsed.data.notes,
      photos: parsed.data.photoUrls,
      signatureUrl,
      signedAt: signatureUrl ? new Date() : null,
    })
    .returning();

  // Link to booking
  const patch =
    parsed.data.type === "pickup"
      ? { pickupInspectionId: row.id, status: "active" as const }
      : { returnInspectionId: row.id, status: "completed" as const };
  await db.update(bookings).set(patch).where(eq(bookings.id, id));

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: `inspection.${parsed.data.type}_recorded`,
    entityType: "booking",
    entityId: id,
    metadata: { inspectionId: row.id },
  });

  return NextResponse.json({ inspection: row }, { status: 201 });
}
