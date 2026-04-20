import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { pricingRules, auditLogs } from "@/lib/db/schema";
import { pricingRuleSchema } from "@/lib/validators/pricing";

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = pricingRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(pricingRules)
    .values({ ...parsed.data, trailerId: parsed.data.trailerId ?? null })
    .returning();

  await db.insert(auditLogs).values({
    userId: guard.user.id,
    action: "pricing_rule.created",
    entityType: "pricing_rule",
    entityId: row.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ rule: row }, { status: 201 });
}
