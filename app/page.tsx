import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { TrailerCard } from "@/components/marketing/trailer-card";
import { CalendarCheck, ShieldCheck, Truck } from "lucide-react";

export default async function HomePage() {
  const featured = await db
    .select()
    .from(trailers)
    .where(eq(trailers.status, "active"))
    .limit(4);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=2000"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container py-20 md:py-32 max-w-3xl">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Pell City, Alabama
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5">
            Camp and flatbed trailers. Booked online. Picked up local.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Real-time availability, instant confirmation, and a rental agreement you can
            sign from your phone. Whether you&apos;re heading to Logan Martin for the
            weekend or hauling a UTV across the county, we&apos;ve got the trailer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/fleet">Browse the fleet</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 grid gap-8 md:grid-cols-3">
        <Feature
          icon={<CalendarCheck className="h-6 w-6" />}
          title="Real-time availability"
          body="See open dates instantly. No phone tag. Book 24/7."
        />
        <Feature
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Deposit, not a charge"
          body="Security deposit is authorized on your card and released after return if there's no damage."
        />
        <Feature
          icon={<Truck className="h-6 w-6" />}
          title="Know your tow"
          body="Every trailer lists GVWR, tongue weight, and required hitch class so you pick the right rig."
        />
      </section>

      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">The fleet</h2>
            <p className="text-muted-foreground mt-1">A quick look at what&apos;s on the lot.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/fleet">See all</Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t) => (
            <TrailerCard key={t.id} trailer={t} />
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container py-16 md:py-20 grid gap-6 md:grid-cols-[2fr_1fr] items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Ready to hitch up?
            </h2>
            <p className="opacity-90 max-w-xl">
              Create an account, pick your dates, upload your license, and sign the
              agreement from your phone. Pickup is at our Pell City lot.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:justify-end gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary">
              <Link href="/fleet">Browse trailers</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
