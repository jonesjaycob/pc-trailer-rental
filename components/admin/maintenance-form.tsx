"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MaintenanceForm({ trailers }: { trailers: Trailer[] }) {
  const router = useRouter();
  const [trailerId, setTrailerId] = useState(trailers[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trailerId, startDate, endDate, reason: reason || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    setStartDate("");
    setEndDate("");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div>
        <Label>Trailer</Label>
        <select
          value={trailerId}
          onChange={(e) => setTrailerId(e.target.value)}
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3"
        >
          {trailers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
        <Label>Reason (optional)</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. brake service"
          className="mt-1"
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Block these dates"}
      </Button>
    </form>
  );
}
