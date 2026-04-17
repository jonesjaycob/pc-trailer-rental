import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { requireUser } from "@/lib/rbac";
import { BookingWizard } from "@/components/booking/booking-wizard";

type Search = { start?: string; end?: string };

export const metadata = { title: "Book a trailer" };

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ trailerId: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  const { trailerId } = await params;
  const { start, end } = await searchParams;

  const [trailer] = await db
    .select()
    .from(trailers)
    .where(eq(trailers.id, trailerId))
    .limit(1);

  if (!trailer) notFound();
  if (trailer.status !== "active") {
    redirect(`/fleet/${trailer.slug}`);
  }

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <BookingWizard
        trailer={trailer}
        user={{
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
        }}
        initialStart={start}
        initialEnd={end}
      />
    </div>
  );
}
