import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultWindow } from "@/lib/reports";

describe("defaultWindow", () => {
  afterEach(() => vi.useRealTimers());

  it("returns the current month with a day count between 28 and 31", () => {
    const w = defaultWindow();
    expect(w.startIso).toMatch(/^\d{4}-\d{2}-01$/);
    expect(w.days).toBeGreaterThanOrEqual(28);
    expect(w.days).toBeLessThanOrEqual(31);
  });

  it("returns 31 days for a 31-day month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    const w = defaultWindow();
    expect(w.days).toBe(31);
    expect(w.startIso).toBe("2026-07-01");
    expect(w.endIso).toBe("2026-07-31");
  });

  it("returns 28 days for a non-leap February", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T12:00:00"));
    const w = defaultWindow();
    expect(w.days).toBe(28);
    expect(w.endIso).toBe("2026-02-28");
  });

  it("returns 29 days for a leap February", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-02-10T12:00:00"));
    const w = defaultWindow();
    expect(w.days).toBe(29);
    expect(w.endIso).toBe("2028-02-29");
  });
});
