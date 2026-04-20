import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { JsonLd, trailerJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t] = await db.select().from(trailers).where(eq(trailers.slug, slug)).limit(1);
  if (!t) return { title: "Trailer not found" };
  return { title: t.name, description: t.description };
}

export default async function TrailerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t] = await db.select().from(trailers).where(eq(trailers.slug, slug)).limit(1);
  if (!t || t.status === "retired") notFound();

  const typeLabel = t.type === "camp_trailer" ? "Camp trailer" : "Flatbed";

  return (
    <div className="container py-12">
      <JsonLd data={trailerJsonLd(t)} />
      <Link href="/fleet" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← Back to fleet
      </Link>

      <div className="grid lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12">
        <div>
          <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-secondary">
            {t.photos[0] && (
              <Image
                src={t.photos[0]}
                alt={t.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            )}
          </div>
          {t.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {t.photos.slice(1, 5).map((src, i) => (
                <div key={i} className="aspect-square relative rounded-md overflow-hidden bg-secondary">
                  <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="secondary" className="mb-3">{typeLabel}</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.name}</h1>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold">{formatCurrency(t.dailyRateCents)}</span>
            <span className="text-muted-foreground">/ day</span>
          </div>

          <p className="text-muted-foreground mb-6">{t.description}</p>

          <div className="rounded-lg border p-4 mb-6 bg-secondary/30">
            <p className="text-sm font-semibold mb-2">Tow vehicle requirements</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Hitch:</strong> {t.requiredHitchClass}</li>
              <li><strong className="text-foreground">GVWR:</strong> {t.gvwrLbs.toLocaleString()} lb — your tow vehicle and hitch must be rated for at least this.</li>
              <li><strong className="text-foreground">Tongue weight:</strong> {t.tongueWeightLbs.toLocaleString()} lb</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <Spec label="Length" value={`${t.lengthFt}'`} />
            <Spec label="Width" value={`${t.widthFt}'`} />
            <Spec label="Empty weight" value={`${t.emptyWeightLbs.toLocaleString()} lb`} />
            <Spec label="GVWR" value={`${t.gvwrLbs.toLocaleString()} lb`} />
            {t.sleeps ? <Spec label="Sleeps" value={t.sleeps.toString()} /> : null}
            <Spec label="Security deposit" value={formatCurrency(t.securityDepositCents)} />
          </div>

          <div className="rounded-lg border p-4 mb-6 text-sm space-y-2">
            <div className="flex justify-between"><span>Daily</span><span className="font-semibold">{formatCurrency(t.dailyRateCents)}</span></div>
            <div className="flex justify-between"><span>Weekend (Fri–Sun)</span><span className="font-semibold">{formatCurrency(t.weekendRateCents)}</span></div>
            <div className="flex justify-between"><span>Weekly (7 days)</span><span className="font-semibold">{formatCurrency(t.weeklyRateCents)}</span></div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href={`/book/${t.id}`}>Check availability & book</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You must be 21+ with a valid driver&apos;s license. A security deposit is authorized at booking and released after a clean return.
          </p>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
