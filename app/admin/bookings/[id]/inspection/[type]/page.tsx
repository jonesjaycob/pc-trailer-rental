import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db/client";
import { bookings, trailers, users, inspections } from "@/lib/db/schema";
import { InspectionForm } from "@/components/admin/inspection-form";
import { formatDate } from "@/lib/utils";

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { id, type } = await params;
  if (type !== "pickup" && type !== "return") notFound();

  const [row] = await db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();

  const [existing] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.bookingId, id), eq(inspections.type, type)))
    .limit(1);

  const isCompleted = !!existing;

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/bookings/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to booking
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4 mb-1">
        {type === "pickup" ? "Pickup" : "Return"} inspection
      </h1>
      <p className="text-muted-foreground mb-6">
        {row.trailer.name} · {row.user.name ?? row.user.email} ·{" "}
        {formatDate(type === "pickup" ? row.booking.startDate : row.booking.endDate)}
      </p>

      {isCompleted ? (
        <CompletedInspection inspection={existing} />
      ) : (
        <InspectionForm bookingId={id} type={type} />
      )}
    </div>
  );
}

function CompletedInspection({
  inspection,
}: {
  inspection: typeof inspections.$inferSelect;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <p className="text-sm text-primary font-semibold">
        Inspection recorded {formatDate(inspection.createdAt)}
      </p>
      {inspection.mileageOrHours != null && (
        <Field label="Mileage / hours">{inspection.mileageOrHours.toString()}</Field>
      )}
      {inspection.fuelLevel && <Field label="Fuel level">{inspection.fuelLevel}</Field>}
      {inspection.notes && <Field label="Notes">{inspection.notes}</Field>}
      {inspection.photos.length > 0 && (
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-2">Photos</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {inspection.photos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-md overflow-hidden border"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="150px" />
              </a>
            ))}
          </div>
        </div>
      )}
      {inspection.signatureUrl && (
        <Field label="Customer signature">
          <Image
            src={inspection.signatureUrl}
            alt="Signature"
            width={240}
            height={80}
            className="bg-white rounded border p-1 mt-1"
          />
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
