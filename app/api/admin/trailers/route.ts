import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { trailers, auditLogs } from "@/lib/db/schema";
import { trailerSchema } from "@/lib/validators/trailer";

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = trailerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [row] = await db.insert(trailers).values(parsed.data).returning();
    await db.insert(auditLogs).values({
      userId: guard.user.id,
      action: "trailer.created",
      entityType: "trailer",
      entityId: row.id,
    });
    return NextResponse.json({ trailer: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.includes("trailer_slug_unique") || message.includes("unique")) {
      return NextResponse.json({ error: "That slug is already used" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
