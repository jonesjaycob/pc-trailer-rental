import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { TrailerForm } from "@/components/admin/trailer-form";

export const metadata = { title: "Edit trailer" };

export default async function EditTrailerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t] = await db.select().from(trailers).where(eq(trailers.id, id)).limit(1);
  if (!t) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Edit {t.name}</h1>
      <TrailerForm trailer={t} />
    </div>
  );
}
