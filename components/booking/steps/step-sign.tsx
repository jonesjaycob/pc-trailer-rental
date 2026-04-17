"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "../signature-pad";
import { formatCurrency } from "@/lib/utils";
import type { WizardState } from "../booking-wizard";

type Props = {
  trailer: Trailer;
  state: WizardState;
  onBack: () => void;
  onNext: (patch: Partial<WizardState>) => void;
};

export function StepSign({ trailer, state, onBack, onNext }: Props) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
    state.signatureDataUrl ?? null
  );
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!signatureDataUrl) return setError("Please sign before continuing.");
    if (!accepted) return setError("You must accept the rental agreement.");
    if (!state.bookingId) return setError("Missing booking reference. Go back and restart.");

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/bookings/${state.bookingId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: state.phone,
        dob: state.dob,
        driversLicenseUrl: state.driversLicenseUrl,
        signatureDataUrl,
        agreementAccepted: true,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) return setError(data.error ?? "Could not finalize booking.");

    onNext({
      signatureDataUrl,
      rentalClientSecret: data.rentalPaymentIntent.clientSecret,
      depositClientSecret: data.depositPaymentIntent.clientSecret,
      rentalAgreementUrl: data.rentalAgreementUrl,
    });
  }

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-6">
        <div className="rounded-lg border p-4 bg-card">
          <h2 className="font-display font-semibold mb-2">Rental agreement summary</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• I am at least 21 years old and hold a valid driver&apos;s license.</li>
            <li>• My tow vehicle is rated for {trailer.gvwrLbs.toLocaleString()} lb GVWR and uses a {trailer.requiredHitchClass}.</li>
            <li>• I accept responsibility for damage beyond normal wear, cleaning, and loss.</li>
            <li>• I understand the deposit is authorized on my card and released after a clean return.</li>
            <li>• I agree to the{" "}
              <Link href="/legal/cancellation" target="_blank" className="text-primary underline">
                cancellation policy
              </Link>
              {" "}and{" "}
              <Link href="/legal/rental-agreement" target="_blank" className="text-primary underline">
                full rental agreement
              </Link>.
            </li>
          </ul>
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">I&apos;ve read and accept the rental agreement.</span>
          </label>

          <p className="text-sm font-medium mb-2">Your signature</p>
          <SignaturePad onChange={setSignatureDataUrl} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || !accepted || !signatureDataUrl}
          >
            {submitting ? "Preparing payment…" : "Sign and continue to payment"}
          </Button>
        </div>
      </div>

      <aside className="rounded-lg border p-4 bg-card h-fit sticky top-20 text-sm space-y-2">
        <p className="font-medium">Booking summary</p>
        <div className="flex justify-between"><span className="text-muted-foreground">Trailer</span><span>{trailer.name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Pickup</span><span>{state.startDate}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Return</span><span>{state.endDate}</span></div>
        {state.pricing && (
          <>
            <div className="border-t pt-2 flex justify-between"><span className="text-muted-foreground">Rental</span><span>{formatCurrency(state.pricing.subtotalCents)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(state.pricing.taxCents)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(state.pricing.totalCents)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Deposit (held)</span><span>{formatCurrency(state.pricing.depositCents)}</span></div>
          </>
        )}
      </aside>
    </div>
  );
}
