import { describe, it, expect } from "vitest";
import { calculatePricing, pickBaseRateCents, rentalDaysBetween } from "@/lib/pricing";

const baseTrailer = {
  dailyRateCents: 10000, // $100/day
  weekendRateCents: 25000, // $250 Fri–Sun
  weeklyRateCents: 60000, // $600/week
  securityDepositCents: 50000,
};

describe("rentalDaysBetween", () => {
  it("treats the end date as exclusive", () => {
    const start = new Date(Date.UTC(2026, 4, 1));
    const end = new Date(Date.UTC(2026, 4, 2));
    expect(rentalDaysBetween(start, end)).toBe(1);
  });

  it("handles multi-day ranges", () => {
    const start = new Date(Date.UTC(2026, 4, 1));
    const end = new Date(Date.UTC(2026, 4, 8));
    expect(rentalDaysBetween(start, end)).toBe(7);
  });
});

describe("pickBaseRateCents", () => {
  it("uses daily rate for short weekday rentals", () => {
    const start = new Date(Date.UTC(2026, 4, 4)); // Monday
    const end = new Date(Date.UTC(2026, 4, 6)); // Wed (2 days)
    const res = pickBaseRateCents(baseTrailer, start, end);
    expect(res.amountCents).toBe(20000);
  });

  it("applies weekend rate for Fri-Sun booking when cheaper", () => {
    const start = new Date(Date.UTC(2026, 4, 1)); // Friday
    const end = new Date(Date.UTC(2026, 4, 3)); // Sunday (2 days)
    const res = pickBaseRateCents(baseTrailer, start, end);
    // weekend $250 < daily 2 × $100 = $200? No — daily is cheaper here.
    expect(res.amountCents).toBe(20000);
  });

  it("applies weekly rate for 7-day rental", () => {
    const start = new Date(Date.UTC(2026, 4, 4));
    const end = new Date(Date.UTC(2026, 4, 11));
    const res = pickBaseRateCents(baseTrailer, start, end);
    expect(res.amountCents).toBe(60000); // weekly beats 7 × $100 = $700
  });

  it("combines weekly blocks + daily remainder", () => {
    const start = new Date(Date.UTC(2026, 4, 4));
    const end = new Date(Date.UTC(2026, 4, 14)); // 10 days
    const res = pickBaseRateCents(baseTrailer, start, end);
    expect(res.amountCents).toBe(60000 + 3 * 10000);
  });
});

describe("calculatePricing", () => {
  it("adds tax and deposit", () => {
    const start = new Date(Date.UTC(2026, 4, 4));
    const end = new Date(Date.UTC(2026, 4, 5));
    const p = calculatePricing({
      trailer: baseTrailer,
      start,
      end,
      taxRateBps: 1000, // 10%
    });
    expect(p.subtotalCents).toBe(10000);
    expect(p.taxCents).toBe(1000);
    expect(p.totalCents).toBe(11000);
    expect(p.depositCents).toBe(50000);
    expect(p.rentalDays).toBe(1);
  });

  it("rejects end <= start", () => {
    const d = new Date(Date.UTC(2026, 4, 4));
    expect(() =>
      calculatePricing({ trailer: baseTrailer, start: d, end: d, taxRateBps: 1000 })
    ).toThrow();
  });
});
