import { describe, it, expect } from "vitest";
import { calculatePricing, multiplierForDay, pickBaseRateCents } from "@/lib/pricing";
import type { PricingRule } from "@/lib/db/schema";

const trailer = {
  id: "trailer-1",
  dailyRateCents: 10000,
  weekendRateCents: 25000,
  weeklyRateCents: 60000,
  securityDepositCents: 50000,
};

function rule(partial: Partial<PricingRule> = {}): PricingRule {
  return {
    id: "r",
    label: "test",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    multiplierBps: 12500,
    dowMask: 127,
    trailerId: null,
    createdAt: new Date(),
    ...partial,
  } as PricingRule;
}

describe("multiplierForDay", () => {
  it("returns 1 when no rules match", () => {
    const d = new Date(Date.UTC(2026, 3, 1)); // April 1
    expect(multiplierForDay(d, "trailer-1", [rule()])).toBe(1);
  });

  it("applies multiplier when date is inside window", () => {
    const d = new Date(Date.UTC(2026, 4, 15)); // May 15
    expect(multiplierForDay(d, "trailer-1", [rule()])).toBe(1.25);
  });

  it("skips rule bound to another trailer", () => {
    const d = new Date(Date.UTC(2026, 4, 15));
    expect(
      multiplierForDay(d, "trailer-1", [rule({ trailerId: "other-trailer" })])
    ).toBe(1);
  });

  it("applies rule bound to this trailer", () => {
    const d = new Date(Date.UTC(2026, 4, 15));
    expect(
      multiplierForDay(d, "trailer-1", [rule({ trailerId: "trailer-1" })])
    ).toBe(1.25);
  });

  it("respects dowMask (weekends only)", () => {
    const fri = new Date(Date.UTC(2026, 4, 15)); // Fri
    const mon = new Date(Date.UTC(2026, 4, 18)); // Mon
    const weekendOnly = rule({ dowMask: 0b1100001 }); // Fri/Sat/Sun
    expect(multiplierForDay(fri, "trailer-1", [weekendOnly])).toBe(1.25);
    expect(multiplierForDay(mon, "trailer-1", [weekendOnly])).toBe(1);
  });

  it("compounds multiple rules multiplicatively", () => {
    const d = new Date(Date.UTC(2026, 4, 15));
    const r1 = rule({ multiplierBps: 12000 }); // 1.2x
    const r2 = rule({ multiplierBps: 11000 }); // 1.1x
    expect(multiplierForDay(d, "trailer-1", [r1, r2])).toBeCloseTo(1.32);
  });
});

describe("pickBaseRateCents with rules", () => {
  it("applies premium to daily total", () => {
    const start = new Date(Date.UTC(2026, 4, 10));
    const end = new Date(Date.UTC(2026, 4, 13)); // 3 days, all in May
    const res = pickBaseRateCents(trailer, start, end, [rule()]);
    // daily $100 × 1.25 × 3 = $375
    expect(res.amountCents).toBe(37500);
  });

  it("only premium-marks days inside rule window when rule spans partial window", () => {
    const start = new Date(Date.UTC(2026, 3, 29)); // Apr 29
    const end = new Date(Date.UTC(2026, 4, 3)); // May 3 → 4 days
    const res = pickBaseRateCents(trailer, start, end, [rule()]);
    // 2 days Apr (no premium) + 2 days May (1.25x)
    expect(res.amountCents).toBe(10000 * 2 + 12500 * 2);
  });
});

describe("calculatePricing with rules", () => {
  it("passes pricing rules through to subtotal", () => {
    const start = new Date(Date.UTC(2026, 4, 10));
    const end = new Date(Date.UTC(2026, 4, 11));
    const p = calculatePricing({
      trailer,
      start,
      end,
      taxRateBps: 1000,
      pricingRules: [rule()],
    });
    expect(p.subtotalCents).toBe(12500); // $125 with 25% premium
    expect(p.taxCents).toBe(1250);
    expect(p.totalCents).toBe(13750);
  });
});
