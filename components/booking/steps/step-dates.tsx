"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { WizardState } from "../booking-wizard";

type Props = {
  trailer: Trailer;
  state: WizardState;
  onNext: (patch: Partial<WizardState>) => void;
};

function toISO(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}
function fromISO(s?: string) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function StepDates({ trailer, state, onNext }: Props) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromISO(state.startDate),
    to: fromISO(state.endDate),
  });
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/availability?trailerId=${trailer.id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setUnavailable(new Set<string>(data.unavailable ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [trailer.id]);

  const disabledMatcher = useMemo(
    () => [
      { before: new Date() },
      (day: Date) => unavailable.has(toISO(day)),
    ],
    [unavailable]
  );

  const days = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.max(
      1,
      Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [range]);

  const estimateCents = useMemo(() => {
    if (!days) return 0;
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const rem = days % 7;
      return weeks * trailer.weeklyRateCents + rem * trailer.dailyRateCents;
    }
    return days * trailer.dailyRateCents;
  }, [days, trailer]);

  async function submit() {
    setError("");
    if (!range?.from || !range?.to) return setError("Pick a pickup and return date.");
    if (days < trailer.minRentalDays) {
      return setError(`Minimum rental is ${trailer.minRentalDays} day(s).`);
    }

    setSubmitting(true);
    const startDate = toISO(range.from);
    const endDate = toISO(range.to);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trailerId: trailer.id, startDate, endDate }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) return setError(data.error ?? "Could not reserve those dates.");

    onNext({
      startDate,
      endDate,
      bookingId: data.bookingId,
      pricing: data.pricing,
    });
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-lg border p-4 bg-card">
        {loading ? (
          <p className="text-sm text-muted-foreground p-8 text-center">
            Loading availability…
          </p>
        ) : (
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabledMatcher}
            numberOfMonths={1}
            className="!m-0"
          />
        )}
      </div>

      <aside className="rounded-lg border p-4 bg-card space-y-3 h-fit sticky top-20">
        <div>
          <p className="text-sm text-muted-foreground">Daily rate</p>
          <p className="text-2xl font-bold">{formatCurrency(trailer.dailyRateCents)}</p>
        </div>
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Pickup</span>
            <span className="font-medium">{range?.from ? toISO(range.from) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Return</span>
            <span className="font-medium">{range?.to ? toISO(range.to) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Nights</span>
            <span className="font-medium">{days || "—"}</span>
          </div>
        </div>
        {estimateCents > 0 && (
          <div className="border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated rental</span>
              <span className="font-semibold">{formatCurrency(estimateCents)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Final total with tax calculated on next step.
            </p>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={submitting || !range?.from || !range?.to} className="w-full">
          {submitting ? "Reserving…" : "Continue"}
        </Button>
        <p className="text-xs text-muted-foreground">
          We&apos;ll hold these dates for 15 minutes while you check out.
        </p>
      </aside>
    </div>
  );
}
