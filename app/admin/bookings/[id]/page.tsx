import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users, inspections } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookingAdminActions } from "@/components/admin/booking-admin-actions";

export const metadata = { title: "Booking" };

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();

  const allInspections = await db
    .select()
    .from(inspections)
    .where(eq(inspections.bookingId, id));
  const pickup = allInspections.find((i) => i.type === "pickup");
  const returnInsp = allInspections.find((i) => i.type === "return");

  return (
    <div className="max-w-4xl">
      <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to bookings
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{row.trailer.name}</h1>
          <p className="text-muted-foreground mt-1">
            {row.user.name ?? row.user.email} · Booking {row.booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <Badge className="text-sm">{row.booking.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Info label="Pickup">
          {formatDate(row.booking.startDate)}
          {row.booking.pickupTime ? ` at ${row.booking.pickupTime}` : ""}
        </Info>
        <Info label="Return">
          {formatDate(row.booking.endDate)}
          {row.booking.returnTime ? ` by ${row.booking.returnTime}` : ""}
        </Info>
        <Info label="Phone">{row.user.phone ?? "—"}</Info>
        <Info label="Email">{row.user.email}</Info>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold mb-3">Charges</p>
            <div className="space-y-1 text-sm">
              <Row label="Rental" value={formatCurrency(row.booking.subtotalCents)} />
              <Row label="Tax" value={formatCurrency(row.booking.taxCents)} />
              <Row label="Total charged" value={formatCurrency(row.booking.totalCents)} bold />
              <Row label="Deposit held" value={formatCurrency(row.booking.depositCents)} muted />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold mb-3">Documents</p>
            <ul className="space-y-2 text-sm">
              {row.booking.rentalAgreementUrl ? (
                <li>
                  <Link
                    href={row.booking.rentalAgreementUrl}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Signed rental agreement (PDF)
                  </Link>
                </li>
              ) : (
                <li className="text-muted-foreground">No signed agreement yet.</li>
              )}
              {row.user.driversLicenseUrl ? (
                <li>
                  <Link
                    href={row.user.driversLicenseUrl}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Driver&apos;s license photo
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          {(row.booking.status === "active" ||
            row.booking.status === "completed") &&
            row.booking.stripeDepositIntentId && (
              <div className="rounded-lg border bg-card p-4">
                <p className="font-semibold mb-1">Damage claim</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Compare pickup vs return photos and charge specific damages
                  against the security deposit.
                </p>
                <Button asChild variant="accent" size="sm">
                  <Link href={`/admin/bookings/${id}/claim`}>Open claim tool</Link>
                </Button>
              </div>
            )}

          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold mb-3">Inspections</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InspectionCell
                title="Pickup"
                done={!!pickup}
                href={`/admin/bookings/${id}/inspection/pickup`}
                disabled={row.booking.status !== "confirmed" && !pickup}
              />
              <InspectionCell
                title="Return"
                done={!!returnInsp}
                href={`/admin/bookings/${id}/inspection/return`}
                disabled={row.booking.status !== "active" && !returnInsp}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-lg border bg-card p-4 h-fit">
          <p className="font-semibold mb-3">Actions</p>
          <BookingAdminActions
            bookingId={id}
            status={row.booking.status}
            depositCents={row.booking.depositCents}
            hasDepositPi={!!row.booking.stripeDepositIntentId}
          />
        </aside>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{children}</p>
    </div>
  );
}
function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        "flex justify-between " +
        (bold ? "font-semibold border-t pt-1.5 mt-1.5 " : "") +
        (muted ? "text-muted-foreground" : "")
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
function InspectionCell({
  title,
  done,
  href,
  disabled,
}: {
  title: string;
  done: boolean;
  href: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded border p-3">
      <p className="font-medium text-sm">{title}</p>
      {done ? (
        <p className="text-xs text-primary mt-1">Completed</p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Not yet</p>
      )}
      <Button
        asChild={!disabled}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="mt-2 w-full"
      >
        {disabled ? (
          <span>{done ? "View" : "Pending"}</span>
        ) : (
          <Link href={href}>{done ? "View / edit" : "Record"}</Link>
        )}
      </Button>
    </div>
  );
}
