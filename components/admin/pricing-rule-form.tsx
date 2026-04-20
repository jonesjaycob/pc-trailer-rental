"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PricingRuleForm({ trailers }: { trailers: Trailer[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [multiplier, setMultiplier] = useState("1.25");
  const [trailerId, setTrailerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        startDate,
        endDate,
        multiplierBps: Math.round(Number(multiplier) * 10000),
        trailerId: trailerId || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setLabel("");
    setStartDate("");
    setEndDate("");
    setMultiplier("1.25");
    setTrailerId("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div>
        <Label>Label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Memorial Day weekend"
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Start</Label>
          <Input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>End</Label>
          <Input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Multiplier</Label>
        <Input
          type="number"
          step="0.01"
          min="0.1"
          max="5"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          required
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          1.25 = 25% premium; 0.9 = 10% discount.
        </p>
      </div>
      <div>
        <Label>Applies to</Label>
        <select
          value={trailerId}
          onChange={(e) => setTrailerId(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3"
        >
          <option value="">All trailers</option>
          {trailers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Add rule"}
      </Button>
    </form>
  );
}
