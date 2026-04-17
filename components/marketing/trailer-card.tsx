import Link from "next/link";
import Image from "next/image";
import type { Trailer } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, Weight } from "lucide-react";

export function TrailerCard({ trailer }: { trailer: Trailer }) {
  const cover = trailer.photos?.[0];
  const typeLabel = trailer.type === "camp_trailer" ? "Camp trailer" : "Flatbed";

  return (
    <Link
      href={`/fleet/${trailer.slug}`}
      className="group block rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-secondary">
        {cover ? (
          <Image
            src={cover}
            alt={trailer.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : null}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg leading-tight">{trailer.name}</h3>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Weight className="h-3.5 w-3.5" />
            {trailer.gvwrLbs.toLocaleString()} lb GVWR
          </span>
          {trailer.sleeps ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Sleeps {trailer.sleeps}
            </span>
          ) : (
            <span>{trailer.lengthFt}&apos; bed</span>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold">{formatCurrency(trailer.dailyRateCents)}</span>
          <span className="text-sm text-muted-foreground">/ day</span>
        </div>
      </div>
    </Link>
  );
}
