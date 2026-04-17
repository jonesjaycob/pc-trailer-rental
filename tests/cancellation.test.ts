import { describe, it, expect } from "vitest";
import { calculateRefund } from "@/lib/cancellation";

const policy = {
  fullRefundDaysOut: 7,
  partialRefundDaysOut: 3,
  partialRefundPct: 50,
};

const now = new Date("2026-05-01T12:00:00Z");
const totalCents = 20000; // $200

describe("calculateRefund", () => {
  it("gives full refund 7+ days out", () => {
    const r = calculateRefund({
      totalCents,
      pickupAt: new Date("2026-05-10T12:00:00Z"),
      now,
      policy,
    });
    expect(r.tier).toBe("full");
    expect(r.refundCents).toBe(20000);
    expect(r.refundPct).toBe(100);
  });

  it("gives partial refund 3-6 days out", () => {
    const r = calculateRefund({
      totalCents,
      pickupAt: new Date("2026-05-05T12:00:00Z"), // 4 days out
      now,
      policy,
    });
    expect(r.tier).toBe("partial");
    expect(r.refundCents).toBe(10000);
    expect(r.refundPct).toBe(50);
  });

  it("gives no refund under 72 hours", () => {
    const r = calculateRefund({
      totalCents,
      pickupAt: new Date("2026-05-03T11:00:00Z"), // 2 days out
      now,
      policy,
    });
    expect(r.tier).toBe("none");
    expect(r.refundCents).toBe(0);
  });

  it("treats exactly 7 days as full", () => {
    const r = calculateRefund({
      totalCents,
      pickupAt: new Date("2026-05-08T12:00:00Z"),
      now,
      policy,
    });
    expect(r.tier).toBe("full");
  });

  it("treats exactly 3 days as partial", () => {
    const r = calculateRefund({
      totalCents,
      pickupAt: new Date("2026-05-04T12:00:00Z"),
      now,
      policy,
    });
    expect(r.tier).toBe("partial");
  });

  it("rounds partial refund cents", () => {
    const r = calculateRefund({
      totalCents: 11111, // odd number
      pickupAt: new Date("2026-05-05T12:00:00Z"),
      now,
      policy,
    });
    expect(r.refundCents).toBe(Math.round(11111 * 0.5));
  });
});
