import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { pricingRules, auditLogs } from "@/lib/db/schema";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const [row] = await db.delete(pricingRules).where(eq(pricingRules.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "pricing_rule.deleted",
    entityType: "pricing_rule",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
