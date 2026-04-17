"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Status = "pending" | "confirmed" | "active" | "completed" | "cancelled";

type Props = {
  bookingId: string;
  status: Status;
  depositCents: number;
  hasDepositPi: boolean;
};

export function BookingAdminActions({ bookingId, status, depositCents, hasDepositPi }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureAmount, setCaptureAmount] = useState("");
  const [captureReason, setCaptureReason] = useState("");

  async function run(body: unknown) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/bookings/${bookingId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel this booking? Any captured payment will be refunded per policy.")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Cancel failed");
    router.refresh();
  }

  const canApprove = status === "pending";
  const canPickup = status === "confirmed";
  const canReturn = status === "active";
  const canCapture = (status === "active" || status === "completed") && hasDepositPi;
  const canRelease = (status === "active" || status === "completed" || status === "cancelled") && hasDepositPi;
  const canCancel = status !== "cancelled" && status !== "completed";

  return (
    <div className="space-y-2">
      {canApprove && (
        <Button
          onClick={() => run({ action: "approve" })}
          disabled={busy}
          className="w-full"
        >
          Approve booking
        </Button>
      )}
      {canPickup && (
        <Button
          onClick={() => run({ action: "mark_picked_up" })}
          disabled={busy}
          className="w-full"
        >
          Mark picked up
        </Button>
      )}
      {canReturn && (
        <Button
          onClick={() => run({ action: "mark_returned" })}
          disabled={busy}
          className="w-full"
        >
          Mark returned
        </Button>
      )}

      {canCapture && (
        <div>
          {!captureOpen ? (
            <Button
              variant="accent"
              onClick={() => {
                setCaptureOpen(true);
                setCaptureAmount((depositCents / 100).toFixed(2));
              }}
              disabled={busy}
              className="w-full"
            >
              Capture deposit
            </Button>
          ) : (
            <div className="rounded border border-accent/50 bg-accent/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Up to {formatCurrency(depositCents)} authorized
              </p>
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={captureAmount}
                  onChange={(e) => setCaptureAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Reason (shown in audit log)</Label>
                <Input
                  value={captureReason}
                  onChange={(e) => setCaptureReason(e.target.value)}
                  placeholder="e.g. fender damage"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  disabled={busy || !captureReason}
                  onClick={() =>
                    run({
                      action: "capture_deposit",
                      amountCents: Math.round(Number(captureAmount) * 100),
                      reason: captureReason,
                    })
                  }
                >
                  Confirm capture
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCaptureOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canRelease && (
        <Button
          onClick={() => run({ action: "release_deposit" })}
          disabled={busy}
          variant="outline"
          className="w-full"
        >
          Release deposit
        </Button>
      )}

      {canCancel && (
        <Button
          onClick={cancel}
          disabled={busy}
          variant="destructive"
          className="w-full"
        >
          Cancel booking
        </Button>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
