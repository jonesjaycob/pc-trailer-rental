import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db/client";
import { bookings, trailers } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelButton } from "@/components/dashboard/cancel-button";
import { calculateRefund } from "@/lib/cancellation";
import { getSettings } from "@/lib/bookings";
import { parseDateOnly } from "@/lib/availability";

export const metadata = { title: "Booking" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { paid } = await searchParams;

  const [row] = await db
    .select({ booking: bookings, trailer: trailers })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();
  if (row.booking.userId !== user.id && user.role !== "admin") notFound();

  const s = await getSettings();
  const refundPreview = calculateRefund({
    totalCents: row.booking.totalCents,
    pickupAt: parseDateOnly(row.booking.startDate),
    policy: s.cancellationPolicyJson,
  });

  const canCancel =
    row.booking.status !== "cancelled" &&
    row.booking.status !== "completed" &&
    row.booking.status !== "active";

  return (
    <div className="container py-12 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>

      {paid === "1" && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-semibold text-primary">Payment received.</p>
          <p className="text-sm text-muted-foreground">
            Your booking is being finalized. You&apos;ll get a confirmation email shortly.
          </p>
        </div>
      )}

      <div className="mt-4 mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{row.trailer.name}</h1>
        <Badge>{row.booking.status}</Badge>
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
        <Info label="Required hitch">{row.trailer.requiredHitchClass}</Info>
        <Info label="Booking ID">{row.booking.id.slice(0, 8).toUpperCase()}</Info>
      </div>

      <div className="rounded-lg border p-4 bg-card text-sm space-y-1.5 mb-6">
        <p className="font-semibold mb-2">Charges</p>
        <div className="flex justify-between"><span>Rental subtotal</span><span>{formatCurrency(row.booking.subtotalCents)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(row.booking.taxCents)}</span></div>
        <div className="flex justify-between font-semibold border-t pt-1.5 mt-1.5"><span>Total charged</span><span>{formatCurrency(row.booking.totalCents)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Deposit (held)</span><span>{formatCurrency(row.booking.depositCents)}</span></div>
      </div>

      <div className="flex flex-wrap gap-3">
        {row.booking.rentalAgreementUrl && (
          <Button asChild variant="outline">
            <a href={row.booking.rentalAgreementUrl} target="_blank" rel="noopener noreferrer">
              Download signed agreement
            </a>
          </Button>
        )}
        {canCancel && (
          <CancelButton
            bookingId={row.booking.id}
            refundPreview={refundPreview}
          />
        )}
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 bg-card">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{children}</p>
    </div>
  );
}
