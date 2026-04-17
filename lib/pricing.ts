import type { Trailer } from "@/lib/db/schema";

export type PricingLineItem = { label: string; amountCents: number };

export type PricingBreakdown = {
  lineItems: PricingLineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  rentalDays: number;
};

/**
 * Count of calendar days between start (inclusive) and end (exclusive).
 * A 1-day rental is start today, return tomorrow → 1 day.
 */
export function rentalDaysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

/**
 * Picks the cheapest tier (daily × N, weekend flat, weekly flat) for the renter.
 * A "weekend" here is a Fri-Sun (2 or 3 night) window — we apply the weekend rate
 * if the booking covers exactly a Fri–Sun or Fri–Mon window, otherwise we compare
 * daily and weekly.
 */
export function pickBaseRateCents(
  trailer: Pick<Trailer, "dailyRateCents" | "weekendRateCents" | "weeklyRateCents">,
  start: Date,
  end: Date
): { amountCents: number; label: string; days: number } {
  const days = rentalDaysBetween(start, end);
  const startDow = start.getUTCDay(); // 0 = Sun, 5 = Fri

  const isWeekendWindow =
    startDow === 5 && (days === 2 || days === 3); // Fri-Sun or Fri-Mon

  const dailyTotal = trailer.dailyRateCents * days;
  const weeklyBlocks = Math.floor(days / 7);
  const weeklyRemainder = days % 7;
  const weeklyTotal =
    weeklyBlocks * trailer.weeklyRateCents + weeklyRemainder * trailer.dailyRateCents;

  const options: { amountCents: number; label: string }[] = [
    { amountCents: dailyTotal, label: `Daily rate × ${days}` },
    { amountCents: weeklyTotal, label: `Weekly rate + ${weeklyRemainder} day(s)` },
  ];
  if (isWeekendWindow) {
    options.push({ amountCents: trailer.weekendRateCents, label: "Weekend rate (Fri–Sun)" });
  }

  const best = options.reduce((a, b) => (b.amountCents < a.amountCents ? b : a));
  return { amountCents: best.amountCents, label: best.label, days };
}

export type PricingInput = {
  trailer: Pick<
    Trailer,
    "dailyRateCents" | "weekendRateCents" | "weeklyRateCents" | "securityDepositCents"
  >;
  start: Date;
  end: Date;
  taxRateBps: number; // e.g. 1000 = 10.00%
};

export function calculatePricing({ trailer, start, end, taxRateBps }: PricingInput): PricingBreakdown {
  if (end <= start) throw new Error("End date must be after start date");

  const base = pickBaseRateCents(trailer, start, end);
  const subtotal = base.amountCents;
  const tax = Math.round((subtotal * taxRateBps) / 10000);
  const total = subtotal + tax;

  return {
    lineItems: [
      { label: base.label, amountCents: base.amountCents },
      { label: `Sales tax (${(taxRateBps / 100).toFixed(2)}%)`, amountCents: tax },
    ],
    subtotalCents: subtotal,
    taxCents: tax,
    totalCents: total,
    depositCents: trailer.securityDepositCents,
    rentalDays: base.days,
  };
}
