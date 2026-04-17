"use client";

import { useState } from "react";
import type { Trailer } from "@/lib/db/schema";
import { StepDates } from "./steps/step-dates";
import { StepInfo } from "./steps/step-info";
import { StepLicense } from "./steps/step-license";
import { StepSign } from "./steps/step-sign";
import { StepPay } from "./steps/step-pay";

type Props = {
  trailer: Trailer;
  user: { id: string; email: string; name: string };
  initialStart?: string;
  initialEnd?: string;
};

export type WizardState = {
  step: 1 | 2 | 3 | 4 | 5;
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  returnTime?: string;
  bookingId?: string;
  pricing?: {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    depositCents: number;
    rentalDays: number;
  };
  phone?: string;
  dob?: string;
  driversLicenseUrl?: string;
  signatureDataUrl?: string;
  rentalClientSecret?: string;
  depositClientSecret?: string;
  rentalAgreementUrl?: string;
};

const STEPS = ["Dates", "Your info", "License", "Sign", "Pay"] as const;

export function BookingWizard({ trailer, user, initialStart, initialEnd }: Props) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    startDate: initialStart,
    endDate: initialEnd,
  });

  const update = (patch: Partial<WizardState>) =>
    setState((s) => ({ ...s, ...patch }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
          Book the {trailer.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Step {state.step} of {STEPS.length}: {STEPS[state.step - 1]}
        </p>
        <div className="mt-4 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < state.step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
      </div>

      {state.step === 1 && (
        <StepDates
          trailer={trailer}
          state={state}
          onNext={(patch) => update({ ...patch, step: 2 })}
        />
      )}
      {state.step === 2 && (
        <StepInfo
          user={user}
          state={state}
          onBack={() => update({ step: 1 })}
          onNext={(patch) => update({ ...patch, step: 3 })}
        />
      )}
      {state.step === 3 && (
        <StepLicense
          state={state}
          onBack={() => update({ step: 2 })}
          onNext={(patch) => update({ ...patch, step: 4 })}
        />
      )}
      {state.step === 4 && (
        <StepSign
          trailer={trailer}
          state={state}
          onBack={() => update({ step: 3 })}
          onNext={(patch) => update({ ...patch, step: 5 })}
        />
      )}
      {state.step === 5 && (
        <StepPay
          trailer={trailer}
          state={state}
          onBack={() => update({ step: 4 })}
        />
      )}
    </div>
  );
}
