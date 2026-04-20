import type { Trailer, PricingRule } from "@/lib/db/schema";

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
 * Returns the combined multiplier (as a float, 1.0 = no change) for a given
 * calendar day and trailer, applying all matching pricing rules
 * multiplicatively. A rule matches if:
 *  - the day falls in [startDate, endDate]
 *  - the day-of-week bit in `dowMask` is set
 *  - `trailerId` is null (applies to all trailers) OR equals this trailer.
 */
export function multiplierForDay(
  day: Date,
  trailerId: string,
  rules: PricingRule[]
): number {
  const iso = day.toISOString().slice(0, 10);
  const dow = day.getUTCDay(); // 0 = Sun
  const bit = 1 << dow;

  let mult = 1;
  for (const rule of rules) {
    if (rule.trailerId && rule.trailerId !== trailerId) continue;
    if ((rule.dowMask & bit) === 0) continue;
    if (iso < rule.startDate || iso > rule.endDate) continue;
    mult *= rule.multiplierBps / 10000;
  }
  return mult;
}

/**
 * Sums the daily rate across the booking window, applying per-day multipliers.
 * Returns the multiplied daily-rate total plus how many days had a premium.
 */
export function calculateRuleBasedDailyTotal({
  trailer,
  start,
  end,
  rules,
}: {
  trailer: Pick<Trailer, "dailyRateCents" | "id">;
  start: Date;
  end: Date;
  rules: PricingRule[];
}) {
  let total = 0;
  let daysWithPremium = 0;
  for (
    let d = new Date(start.getTime());
    d < end;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    const mult = multiplierForDay(d, trailer.id, rules);
    total += Math.round(trailer.dailyRateCents * mult);
    if (mult !== 1) daysWithPremium++;
  }
  return { total, daysWithPremium };
}

/**
 * Picks the cheapest tier for the renter, considering dynamic pricing rules:
 *   - daily: per-day daily rate × applicable multiplier
 *   - weekly blocks (7 days): flat weekly rate, untouched by day-of-week rules
 *     (seasonal rules still apply via an average-multiplier approach below)
 *   - weekend: Fri-Sun or Fri-Mon flat, unchanged
 * Rules can only INCREASE (premium) or DECREASE the daily sum. Weekly and
 * weekend flat rates are multiplied by the max multiplier over the window, so
 * a customer can't escape a holiday premium by choosing the weekly tier.
 */
export function pickBaseRateCents(
  trailer: Pick<Trailer, "id" | "dailyRateCents" | "weekendRateCents" | "weeklyRateCents">,
  start: Date,
  end: Date,
  rules: PricingRule[] = []
): { amountCents: number; label: string; days: number } {
  const days = rentalDaysBetween(start, end);
  const startDow = start.getUTCDay();
  const isWeekendWindow = startDow === 5 && (days === 2 || days === 3);

  const dailyCalc = calculateRuleBasedDailyTotal({ trailer, start, end, rules });
  const dailyLabel =
    dailyCalc.daysWithPremium > 0
      ? `Daily rate × ${days} (${dailyCalc.daysWithPremium} day(s) with premium/discount)`
      : `Daily rate × ${days}`;

  // For flat tiers, apply the max multiplier across the window.
  let maxMult = 1;
  for (
    let d = new Date(start.getTime());
    d < end;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    const m = multiplierForDay(d, trailer.id, rules);
    if (m > maxMult) maxMult = m;
  }

  const weeklyBlocks = Math.floor(days / 7);
  const weeklyRemainder = days % 7;
  const weeklyFlat = Math.round(trailer.weeklyRateCents * maxMult);
  const weeklyDailyRemainderSum =
    weeklyRemainder > 0
      ? calculateRuleBasedDailyTotal({
          trailer,
          start: new Date(start.getTime() + weeklyBlocks * 7 * 24 * 60 * 60 * 1000),
          end,
          rules,
        }).total
      : 0;
  const weeklyTotal = weeklyBlocks * weeklyFlat + weeklyDailyRemainderSum;

  const options: { amountCents: number; label: string }[] = [
    { amountCents: dailyCalc.total, label: dailyLabel },
    { amountCents: weeklyTotal, label: `Weekly rate + ${weeklyRemainder} day(s)` },
  ];
  if (isWeekendWindow) {
    options.push({
      amountCents: Math.round(trailer.weekendRateCents * maxMult),
      label: "Weekend rate (Fri–Sun)",
    });
  }

  const best = options.reduce((a, b) => (b.amountCents < a.amountCents ? b : a));
  return { amountCents: best.amountCents, label: best.label, days };
}

export type PricingInput = {
  trailer: Pick<
    Trailer,
    "id" | "dailyRateCents" | "weekendRateCents" | "weeklyRateCents" | "securityDepositCents"
  >;
  start: Date;
  end: Date;
  taxRateBps: number;
  pricingRules?: PricingRule[];
};

export function calculatePricing({
  trailer,
  start,
  end,
  taxRateBps,
  pricingRules = [],
}: PricingInput): PricingBreakdown {
  if (end <= start) throw new Error("End date must be after start date");

  const base = pickBaseRateCents(trailer, start, end, pricingRules);
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
