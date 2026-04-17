import { describe, it, expect } from "vitest";
import { isRangeAvailable, rangesOverlap, withBuffer } from "@/lib/availability";

const d = (iso: string) => new Date(iso);

describe("rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    expect(
      rangesOverlap(
        { start: d("2026-05-01"), end: d("2026-05-05") },
        { start: d("2026-05-04"), end: d("2026-05-08") }
      )
    ).toBe(true);
  });

  it("treats touching ranges as non-overlapping (half-open)", () => {
    expect(
      rangesOverlap(
        { start: d("2026-05-01"), end: d("2026-05-05") },
        { start: d("2026-05-05"), end: d("2026-05-08") }
      )
    ).toBe(false);
  });
});

describe("withBuffer", () => {
  it("extends the end of a range by buffer hours", () => {
    const buffered = withBuffer(
      { start: d("2026-05-01T12:00Z"), end: d("2026-05-02T12:00Z") },
      4
    );
    expect(buffered.end.toISOString()).toBe("2026-05-02T16:00:00.000Z");
  });
});

describe("isRangeAvailable", () => {
  const existing = { start: d("2026-05-10T12:00Z"), end: d("2026-05-12T12:00Z") };

  it("returns true when no blockers overlap", () => {
    expect(
      isRangeAvailable(
        { start: d("2026-06-01"), end: d("2026-06-03") },
        [existing],
        4
      )
    ).toBe(true);
  });

  it("blocks an overlapping booking", () => {
    expect(
      isRangeAvailable(
        { start: d("2026-05-11"), end: d("2026-05-13") },
        [existing],
        4
      )
    ).toBe(false);
  });

  it("blocks within the buffer window", () => {
    expect(
      isRangeAvailable(
        { start: d("2026-05-12T14:00Z"), end: d("2026-05-14T12:00Z") },
        [existing],
        4
      )
    ).toBe(false);
  });

  it("allows a booking after the buffer clears", () => {
    expect(
      isRangeAvailable(
        { start: d("2026-05-12T17:00Z"), end: d("2026-05-14T12:00Z") },
        [existing],
        4
      )
    ).toBe(true);
  });
});
