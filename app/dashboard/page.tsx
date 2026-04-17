import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, trailers } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const rows = await db
    .select({ booking: bookings, trailer: trailers })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.startDate));

  const now = new Date();
  const upcoming = rows.filter(
    (r) =>
      new Date(r.booking.endDate) >= now &&
      r.booking.status !== "cancelled" &&
      r.booking.status !== "completed"
  );
  const past = rows.filter(
    (r) =>
      new Date(r.booking.endDate) < now ||
      r.booking.status === "cancelled" ||
      r.booking.status === "completed"
  );

  return (
    <div className="container py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Hi, {user.name ?? user.email}
          </h1>
          <p className="text-muted-foreground">Your rentals and account.</p>
        </div>
        <Button asChild>
          <Link href="/fleet">Book another trailer</Link>
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border p-8 text-center">
            No upcoming bookings.{" "}
            <Link href="/fleet" className="text-primary underline">
              Browse the fleet
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <BookingRow key={r.booking.id} booking={r.booking} trailer={r.trailer} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Past</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <BookingRow key={r.booking.id} booking={r.booking} trailer={r.trailer} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  trailer,
}: {
  booking: typeof bookings.$inferSelect;
  trailer: typeof trailers.$inferSelect;
}) {
  const statusVariant: Record<string, "default" | "secondary" | "accent"> = {
    confirmed: "default",
    pending: "secondary",
    active: "accent",
    completed: "secondary",
    cancelled: "secondary",
  };

  return (
    <Link
      href={`/dashboard/bookings/${booking.id}`}
      className="block rounded-lg border p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{trailer.name}</h3>
            <Badge variant={statusVariant[booking.status] ?? "secondary"}>
              {booking.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{formatCurrency(booking.totalCents)}</p>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(booking.depositCents)} hold
          </p>
        </div>
      </div>
    </Link>
  );
}
