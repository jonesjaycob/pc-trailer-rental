"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type LineItem = { description: string; amountDollars: string };

export function DamageClaimForm({
  bookingId,
  maxCents,
}: {
  bookingId: string;
  maxCents: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([{ description: "", amountDollars: "" }]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totalCents = items.reduce(
    (sum, li) => sum + Math.round(Number(li.amountDollars || 0) * 100),
    0
  );
  const overMax = totalCents > maxCents;

  function addItem() {
    setItems((arr) => [...arr, { description: "", amountDollars: "" }]);
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, j) => j !== i));
  }
  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((li, j) => (i === j ? { ...li, ...patch } : li)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.some((li) => !li.description || !li.amountDollars)) {
      return setError("Every line item needs a description and amount.");
    }
    if (overMax) {
      return setError("Total exceeds available deposit.");
    }
    if (
      !confirm(
        `Capture ${formatCurrency(totalCents)} against the deposit hold? This is an immediate charge.`
      )
    )
      return;

    setBusy(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: notes || undefined,
        lineItems: items.map((li) => ({
          description: li.description,
          amountCents: Math.round(Number(li.amountDollars) * 100),
        })),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Claim failed");
      return;
    }
    router.refresh();
    setItems([{ description: "", amountDollars: "" }]);
    setNotes("");
  }

  return (
    <form onSubmit={submit} className="rounded-lg border bg-card p-5 space-y-4">
      <p className="font-semibold">New claim</p>

      <div className="space-y-2">
        {items.map((li, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_40px] gap-2">
            <Input
              placeholder="Description (e.g. rear fender dent)"
              value={li.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={li.amountDollars}
              onChange={(e) => updateItem(i, { amountDollars: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add line item
        </Button>
      </div>

      <div>
        <Label>Notes (internal)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Link to photos, repair quotes, etc."
        />
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <div>
          <span className="text-muted-foreground">Total to capture: </span>
          <span className={"font-semibold " + (overMax ? "text-destructive" : "")}>
            {formatCurrency(totalCents)}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            (max {formatCurrency(maxCents)})
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={busy || totalCents === 0 || overMax}
        variant="accent"
      >
        {busy ? "Capturing…" : `Capture ${formatCurrency(totalCents)}`}
      </Button>
    </form>
  );
}
