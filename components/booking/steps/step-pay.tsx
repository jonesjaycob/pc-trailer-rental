"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Trailer } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { WizardState } from "../booking-wizard";

type Props = {
  trailer: Trailer;
  state: WizardState;
  onBack: () => void;
};

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export function StepPay({ trailer, state, onBack }: Props) {
  const stripe = useMemo(() => getStripe(), []);

  if (!stripe) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <p className="font-semibold text-destructive mb-1">Payments are not configured</p>
        <p className="text-sm text-muted-foreground">
          Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in your environment to enable
          checkout. See README.
        </p>
      </div>
    );
  }

  if (!state.rentalClientSecret || !state.depositClientSecret) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Missing payment intents. Please go back and re-sign.</p>
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-6">
      <Elements
        stripe={stripe}
        options={{
          clientSecret: state.rentalClientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <PaymentForm state={state} onBack={onBack} />
      </Elements>

      <aside className="rounded-lg border p-4 bg-card h-fit sticky top-20 text-sm space-y-2">
        <p className="font-medium">Charges</p>
        {state.pricing && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental</span>
              <span>{formatCurrency(state.pricing.subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(state.pricing.taxCents)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Charged now</span>
              <span>{formatCurrency(state.pricing.totalCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Deposit (held, not charged)</span>
              <span>{formatCurrency(state.pricing.depositCents)}</span>
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground pt-2">
          {trailer.name} · {state.startDate} → {state.endDate}
        </p>
        {state.rentalAgreementUrl && (
          <Link
            href={state.rentalAgreementUrl}
            target="_blank"
            className="text-xs text-primary underline block pt-2"
          >
            Download signed agreement
          </Link>
        )}
      </aside>
    </div>
  );
}

function PaymentForm({ state, onBack }: { state: WizardState; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !state.depositClientSecret) return;

    setSubmitting(true);
    setError("");

    // 1. Confirm the rental PI (captures rental fee)
    const rental = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/bookings/${state.bookingId}?paid=1`,
      },
      redirect: "if_required",
    });
    if (rental.error) {
      setError(rental.error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    // 2. Reuse the payment method on the deposit PI (authorizes hold)
    const paymentMethodId = rental.paymentIntent?.payment_method;
    if (typeof paymentMethodId === "string") {
      const deposit = await stripe.confirmCardPayment(state.depositClientSecret, {
        payment_method: paymentMethodId,
      });
      if (deposit.error) {
        setError(
          `Rental charged, but deposit hold failed: ${deposit.error.message}. Please contact us.`
        );
        setSubmitting(false);
        return;
      }
    }

    window.location.href = `/dashboard/bookings/${state.bookingId}?paid=1`;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border p-4 bg-card">
        <PaymentElement />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="submit" disabled={submitting || !stripe || !elements}>
          {submitting ? "Processing…" : "Pay and authorize deposit"}
        </Button>
      </div>
    </form>
  );
}
