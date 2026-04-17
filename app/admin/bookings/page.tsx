import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Bookings" };

type Search = { status?: string };

const statusTabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { status } = await searchParams;
  const filter = status && statusTabs.some((t) => t.key === status) ? status : "all";

  const where =
    filter === "all"
      ? inArray(bookings.status, ["pending", "confirmed", "active", "completed", "cancelled"])
      : eq(bookings.status, filter as "pending");

  const rows = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(where)
    .orderBy(desc(bookings.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Bookings</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusTabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/bookings" : `/admin/bookings?status=${t.key}`}
          >
            <Badge
              variant={filter === t.key ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {t.label}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left p-3">Trailer</th>
              <th className="text-left p-3">Renter</th>
              <th className="text-left p-3">Dates</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No bookings found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.booking.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <Link
                      href={`/admin/bookings/${r.booking.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.trailer.name}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.user.name ?? r.user.email}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(r.booking.startDate)} → {formatDate(r.booking.endDate)}
                  </td>
                  <td className="p-3">{formatCurrency(r.booking.totalCents)}</td>
                  <td className="p-3">
                    <Badge variant="outline">{r.booking.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
