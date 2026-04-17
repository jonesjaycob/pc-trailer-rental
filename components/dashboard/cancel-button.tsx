"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { RefundResult } from "@/lib/cancellation";

export function CancelButton({
  bookingId,
  refundPreview,
}: {
  bookingId: string;
  refundPreview: RefundResult;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        Cancel booking
      </Button>
    );
  }

  async function doCancel() {
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Cancellation failed");
      setSubmitting(false);
      return;
    }
    router.refresh();
  }

  const tierLabel: Record<RefundResult["tier"], string> = {
    full: `Full refund (${formatCurrency(refundPreview.refundCents)})`,
    partial: `${refundPreview.refundPct}% refund (${formatCurrency(refundPreview.refundCents)})`,
    none: "No refund — within 72 hours of pickup",
  };

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 w-full">
      <p className="font-semibold text-destructive mb-1">Cancel this booking?</p>
      <p className="text-sm text-muted-foreground mb-3">
        Based on our cancellation policy: <strong>{tierLabel[refundPreview.tier]}</strong>.
        Your security deposit hold will be released.
      </p>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <div className="flex gap-2">
        <Button variant="destructive" onClick={doCancel} disabled={submitting}>
          {submitting ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
          Keep booking
        </Button>
      </div>
    </div>
  );
}
