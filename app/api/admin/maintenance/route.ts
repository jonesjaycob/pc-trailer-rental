import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { maintenanceBlocks, auditLogs } from "@/lib/db/schema";
import { maintenanceBlockSchema } from "@/lib/validators/admin";
import { parseDateOnly } from "@/lib/availability";
import { checkRangeAvailable } from "@/lib/bookings";

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = maintenanceBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Block overlap with existing bookings or maintenance
  const avail = await checkRangeAvailable(
    parsed.data.trailerId,
    parseDateOnly(parsed.data.startDate),
    parseDateOnly(parsed.data.endDate)
  );
  if (!avail.ok) {
    return NextResponse.json(
      { error: `Cannot block these dates: ${avail.reason}` },
      { status: 409 }
    );
  }

  const [row] = await db.insert(maintenanceBlocks).values(parsed.data).returning();

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "maintenance.created",
    entityType: "maintenance_block",
    entityId: row.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ block: row }, { status: 201 });
}
