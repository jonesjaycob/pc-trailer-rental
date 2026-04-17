/**
 * Cancellation policy refund calculator.
 * Pure function; tested in `tests/cancellation.test.ts`.
 */

export type CancellationPolicy = {
  fullRefundDaysOut: number; // e.g. 7
  partialRefundDaysOut: number; // e.g. 3
  partialRefundPct: number; // e.g. 50
};

export type RefundResult = {
  refundCents: number;
  refundPct: number;
  tier: "full" | "partial" | "none";
  hoursUntilPickup: number;
};

export function calculateRefund({
  totalCents,
  pickupAt,
  now = new Date(),
  policy,
}: {
  totalCents: number;
  pickupAt: Date;
  now?: Date;
  policy: CancellationPolicy;
}): RefundResult {
  const hoursUntilPickup = (pickupAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilPickup = hoursUntilPickup / 24;

  if (daysUntilPickup >= policy.fullRefundDaysOut) {
    return {
      refundCents: totalCents,
      refundPct: 100,
      tier: "full",
      hoursUntilPickup,
    };
  }

  if (daysUntilPickup >= policy.partialRefundDaysOut) {
    const pct = policy.partialRefundPct;
    return {
      refundCents: Math.round((totalCents * pct) / 100),
      refundPct: pct,
      tier: "partial",
      hoursUntilPickup,
    };
  }

  return {
    refundCents: 0,
    refundPct: 0,
    tier: "none",
    hoursUntilPickup,
  };
}
