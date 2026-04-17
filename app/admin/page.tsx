import Link from "next/link";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/bookings";

export const metadata = { title: "Dashboard" };

export default async function AdminHomePage() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [stats] = await db
    .select({
      countMonth: sql<number>`count(*)::int`,
      revenueMonth: sql<number>`coalesce(sum(${bookings.totalCents}), 0)::int`,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.startDate, monthStart),
        inArray(bookings.status, ["confirmed", "active", "completed"])
      )
    );

  const [activeCounts] = await db
    .select({
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)::int`,
      confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)::int`,
      active: sql<number>`sum(case when status = 'active' then 1 else 0 end)::int`,
    })
    .from(bookings);

  const upcomingPickups = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(
      and(
        inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
        gte(bookings.startDate, todayIso)
      )
    )
    .orderBy(bookings.startDate)
    .limit(5);

  const pendingReturns = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.status, "active"))
    .orderBy(bookings.endDate)
    .limit(5);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <StatCard label="Month revenue" value={formatCurrency(stats?.revenueMonth ?? 0)} />
        <StatCard label="Bookings this month" value={String(stats?.countMonth ?? 0)} />
        <StatCard
          label="Pending confirmation"
          value={String(activeCounts?.pending ?? 0)}
          tint="accent"
        />
        <StatCard label="Out on rental" value={String(activeCounts?.active ?? 0)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="Upcoming pickups"
          empty="No upcoming pickups."
          items={upcomingPickups}
          dateKey="startDate"
          href={(id) => `/admin/bookings/${id}`}
        />
        <Panel
          title="Pending returns"
          empty="Nothing out on rental."
          items={pendingReturns}
          dateKey="endDate"
          href={(id) => `/admin/bookings/${id}/inspection/return`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint?: "accent";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          "text-2xl font-bold mt-1 " + (tint === "accent" ? "text-accent" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

type PanelRow = {
  booking: typeof bookings.$inferSelect;
  trailer: typeof trailers.$inferSelect;
  user: typeof users.$inferSelect;
};

function Panel({
  title,
  empty,
  items,
  dateKey,
  href,
}: {
  title: string;
  empty: string;
  items: PanelRow[];
  dateKey: "startDate" | "endDate";
  href: (id: string) => string;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-display font-semibold">{title}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/bookings">View all</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground text-center">{empty}</p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.booking.id} className="border-b last:border-b-0">
              <Link
                href={href(r.booking.id)}
                className="flex items-center justify-between p-4 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{r.trailer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.user.name ?? r.user.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(r.booking[dateKey])}</p>
                  <Badge variant="outline" className="mt-1">
                    {r.booking.status}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
