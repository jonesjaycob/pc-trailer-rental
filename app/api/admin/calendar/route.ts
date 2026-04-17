import { NextResponse } from "next/server";
import { and, gte, lte } from "drizzle-orm";
import { requireAdminApi } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, trailers, maintenanceBlocks, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const HUE_STEP = 47; // prime-ish offset so adjacent trailers look different

function colorForTrailer(index: number) {
  const hue = (index * HUE_STEP) % 360;
  return { background: `hsl(${hue}, 55%, 40%)`, border: `hsl(${hue}, 55%, 30%)` };
}

export async function GET(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const allTrailers = await db.select().from(trailers).orderBy(trailers.createdAt);
  const colors = new Map(allTrailers.map((t, i) => [t.id, colorForTrailer(i)]));

  const bookingRows = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(lte(bookings.startDate, end), gte(bookings.endDate, start)));

  const maintenanceRows = await db
    .select({ block: maintenanceBlocks, trailer: trailers })
    .from(maintenanceBlocks)
    .innerJoin(trailers, eq(maintenanceBlocks.trailerId, trailers.id))
    .where(and(lte(maintenanceBlocks.startDate, end), gte(maintenanceBlocks.endDate, start)));

  const events = [
    ...bookingRows.map((r) => {
      const c = colors.get(r.trailer.id) ?? { background: "#555", border: "#333" };
      const dim = r.booking.status === "cancelled" ? 0.4 : 1;
      return {
        id: `booking:${r.booking.id}`,
        title: `${r.trailer.name} · ${r.user.name ?? r.user.email}`,
        start: r.booking.startDate,
        end: r.booking.endDate,
        allDay: true,
        url: `/admin/bookings/${r.booking.id}`,
        backgroundColor: r.booking.status === "cancelled" ? "#999" : c.background,
        borderColor: c.border,
        extendedProps: {
          kind: "booking",
          status: r.booking.status,
          trailerId: r.trailer.id,
          opacity: dim,
        },
      };
    }),
    ...maintenanceRows.map((r) => {
      const c = colors.get(r.trailer.id) ?? { background: "#555", border: "#333" };
      return {
        id: `maintenance:${r.block.id}`,
        title: `🔧 ${r.trailer.name}${r.block.reason ? ` — ${r.block.reason}` : ""}`,
        start: r.block.startDate,
        end: r.block.endDate,
        allDay: true,
        backgroundColor: "#d0d0d0",
        borderColor: c.border,
        textColor: "#222",
        extendedProps: { kind: "maintenance", trailerId: r.trailer.id },
      };
    }),
  ];

  return NextResponse.json({ events, trailers: allTrailers.map((t, i) => ({ id: t.id, name: t.name, color: colorForTrailer(i).background })) });
}
