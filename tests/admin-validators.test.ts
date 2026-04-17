import { describe, it, expect } from "vitest";
import { bookingActionSchema, maintenanceBlockSchema, inspectionSchema } from "@/lib/validators/admin";
import { trailerSchema } from "@/lib/validators/trailer";

describe("bookingActionSchema", () => {
  it("accepts approve action", () => {
    expect(bookingActionSchema.safeParse({ action: "approve" }).success).toBe(true);
  });

  it("requires amountCents and reason for capture_deposit", () => {
    expect(
      bookingActionSchema.safeParse({ action: "capture_deposit" }).success
    ).toBe(false);
    expect(
      bookingActionSchema.safeParse({
        action: "capture_deposit",
        amountCents: 5000,
        reason: "fender dent",
      }).success
    ).toBe(true);
  });

  it("rejects unknown actions", () => {
    expect(bookingActionSchema.safeParse({ action: "bogus" }).success).toBe(false);
  });

  it("rejects negative capture amount", () => {
    expect(
      bookingActionSchema.safeParse({
        action: "capture_deposit",
        amountCents: -1,
        reason: "x",
      }).success
    ).toBe(false);
  });
});

describe("maintenanceBlockSchema", () => {
  it("requires end after start", () => {
    const same = maintenanceBlockSchema.safeParse({
      trailerId: "11111111-1111-1111-1111-111111111111",
      startDate: "2026-05-01",
      endDate: "2026-05-01",
    });
    expect(same.success).toBe(false);
  });

  it("accepts a valid block", () => {
    const ok = maintenanceBlockSchema.safeParse({
      trailerId: "11111111-1111-1111-1111-111111111111",
      startDate: "2026-05-01",
      endDate: "2026-05-05",
      reason: "brake service",
    });
    expect(ok.success).toBe(true);
  });
});

describe("inspectionSchema", () => {
  it("requires type and photoUrls", () => {
    const res = inspectionSchema.safeParse({ type: "pickup", photoUrls: [] });
    expect(res.success).toBe(true);
  });

  it("rejects a non-PNG signature data URL", () => {
    const res = inspectionSchema.safeParse({
      type: "pickup",
      photoUrls: [],
      signatureDataUrl: "data:image/jpeg;base64,abc",
    });
    expect(res.success).toBe(false);
  });
});

describe("trailerSchema", () => {
  const base = {
    slug: "wanderer-24",
    name: "Wanderer 24",
    type: "camp_trailer" as const,
    description: "A nice travel trailer that sleeps six.",
    lengthFt: 24,
    widthFt: 8,
    gvwrLbs: 6500,
    emptyWeightLbs: 4800,
    tongueWeightLbs: 520,
    requiredHitchClass: "Class III",
    sleeps: 6,
    dailyRateCents: 14500,
    weekendRateCents: 27500,
    weeklyRateCents: 87500,
    securityDepositCents: 50000,
  };

  it("accepts a valid trailer and fills defaults", () => {
    const res = trailerSchema.safeParse(base);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.bufferHours).toBe(4);
      expect(res.data.minRentalDays).toBe(1);
      expect(res.data.status).toBe("active");
    }
  });

  it("rejects an invalid slug", () => {
    const res = trailerSchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(res.success).toBe(false);
  });

  it("rejects negative rates", () => {
    const res = trailerSchema.safeParse({ ...base, dailyRateCents: -1 });
    expect(res.success).toBe(false);
  });
});
