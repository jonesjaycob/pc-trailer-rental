import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/rbac";
import { createBookingSchema } from "@/lib/validators/booking";
import { createDraftBooking } from "@/lib/bookings";

export async function POST(req: Request) {
  const guard = await requireUserApi();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createDraftBooking({
    userId: guard.user.id,
    ...parsed.data,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(
    { bookingId: result.booking.id, pricing: result.pricing },
    { status: 201 }
  );
}
