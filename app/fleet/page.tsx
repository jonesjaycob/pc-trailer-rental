import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { TrailerCard } from "@/components/marketing/trailer-card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Search = { type?: "camp_trailer" | "flatbed" };

export const metadata = { title: "Fleet" };

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { type } = await searchParams;

  const where = type
    ? and(eq(trailers.status, "active"), eq(trailers.type, type))
    : eq(trailers.status, "active");

  const list = await db.select().from(trailers).where(where);

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">The fleet</h1>
        <p className="text-muted-foreground">
          Camp trailers for weekends away and flatbeds for the heavy stuff.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <FilterLink href="/fleet" active={!type}>All</FilterLink>
        <FilterLink href="/fleet?type=camp_trailer" active={type === "camp_trailer"}>
          Camp trailers
        </FilterLink>
        <FilterLink href="/fleet?type=flatbed" active={type === "flatbed"}>
          Flatbeds
        </FilterLink>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">No trailers available right now.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((t) => (
            <TrailerCard key={t.id} trailer={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Badge variant={active ? "default" : "outline"} className="cursor-pointer px-3 py-1">
        {children}
      </Badge>
    </Link>
  );
}
