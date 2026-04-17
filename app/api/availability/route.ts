import { NextResponse } from "next/server";
import { availabilityQuerySchema } from "@/lib/validators/booking";
import { getUnavailableDates, getTrailerById } from "@/lib/bookings";
import { parseDateOnly } from "@/lib/availability";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = availabilityQuerySchema.safeParse({
    trailerId: url.searchParams.get("trailerId"),
    windowStart: url.searchParams.get("windowStart") ?? undefined,
    windowEnd: url.searchParams.get("windowEnd") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { trailerId, windowStart, windowEnd } = parsed.data;
  const trailer = await getTrailerById(trailerId);
  if (!trailer || trailer.status === "retired") {
    return NextResponse.json({ error: "Trailer not found" }, { status: 404 });
  }

  const now = new Date();
  const start = windowStart
    ? parseDateOnly(windowStart)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = windowEnd
    ? parseDateOnly(windowEnd)
    : new Date(start.getTime() + 180 * 24 * 60 * 60 * 1000);

  const unavailable = await getUnavailableDates(trailerId, start, end);

  return NextResponse.json({
    trailerId,
    bufferHours: trailer.bufferHours,
    minRentalDays: trailer.minRentalDays,
    windowStart: start.toISOString().slice(0, 10),
    windowEnd: end.toISOString().slice(0, 10),
    unavailable,
  });
}
