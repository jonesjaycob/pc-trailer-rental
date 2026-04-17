import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, trailers } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUserApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const [row] = await db
    .select({ booking: bookings, trailer: trailers })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.booking.userId !== guard.user.id && guard.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(row);
}
