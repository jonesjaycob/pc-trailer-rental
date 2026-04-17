import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { trailers, auditLogs } from "@/lib/db/schema";
import { trailerSchema } from "@/lib/validators/trailer";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = trailerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(trailers)
    .set(parsed.data)
    .where(eq(trailers.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "trailer.updated",
    entityType: "trailer",
    entityId: id,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ trailer: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Retire (soft delete) to preserve FK integrity with bookings
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const [row] = await db
    .update(trailers)
    .set({ status: "retired" })
    .where(eq(trailers.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "trailer.retired",
    entityType: "trailer",
    entityId: id,
  });

  return NextResponse.json({ trailer: row });
}
