import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users, inspections, damageClaims } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";
import { DamageClaimForm } from "@/components/admin/damage-claim-form";

export const metadata = { title: "Damage claim" };

export default async function ClaimPage({
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

  const [pickup] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.bookingId, id), eq(inspections.type, "pickup")))
    .limit(1);
  const [returnI] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.bookingId, id), eq(inspections.type, "return")))
    .limit(1);

  const existingClaims = await db
    .select()
    .from(damageClaims)
    .where(eq(damageClaims.bookingId, id));
  const alreadyCaptured = existingClaims.reduce((s, c) => s + c.totalCents, 0);
  const remaining = Math.max(0, row.booking.depositCents - alreadyCaptured);

  return (
    <div className="max-w-5xl">
      <Link
        href={`/admin/bookings/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to booking
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4 mb-1">Damage claim</h1>
      <p className="text-muted-foreground mb-6">
        {row.trailer.name} · {row.user.name ?? row.user.email}
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <PhotoPanel title="Pickup condition" photos={pickup?.photos ?? []} notes={pickup?.notes} />
        <PhotoPanel title="Return condition" photos={returnI?.photos ?? []} notes={returnI?.notes} />
      </div>

      <div className="rounded-lg border bg-card p-4 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposit authorized</span>
          <span className="font-medium">{formatCurrency(row.booking.depositCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Already captured</span>
          <span className="font-medium">{formatCurrency(alreadyCaptured)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t mt-2 pt-2">
          <span>Available to charge</span>
          <span>{formatCurrency(remaining)}</span>
        </div>
      </div>

      {existingClaims.length > 0 && (
        <div className="rounded-lg border bg-card p-4 mb-6 text-sm">
          <p className="font-semibold mb-2">Previous claims</p>
          <ul className="space-y-2">
            {existingClaims.map((c) => (
              <li key={c.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                  <span className="font-medium">{formatCurrency(c.totalCents)}</span>
                </div>
                <ul className="mt-1 text-xs text-muted-foreground pl-4 list-disc">
                  {c.lineItems.map((li, i) => (
                    <li key={i}>
                      {li.description} — {formatCurrency(li.amountCents)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {remaining > 0 ? (
        <DamageClaimForm bookingId={id} maxCents={remaining} />
      ) : (
        <p className="text-muted-foreground">
          The deposit is fully captured. No further claims can be made.
        </p>
      )}
    </div>
  );
}

function PhotoPanel({
  title,
  photos,
  notes,
}: {
  title: string;
  photos: string[];
  notes?: string | null;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="font-semibold mb-3">{title}</p>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded overflow-hidden border"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            </a>
          ))}
        </div>
      )}
      {notes && (
        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
          {notes}
        </p>
      )}
    </div>
  );
}
