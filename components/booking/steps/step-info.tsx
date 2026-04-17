"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardState } from "../booking-wizard";

type Props = {
  user: { id: string; email: string; name: string };
  state: WizardState;
  onBack: () => void;
  onNext: (patch: Partial<WizardState>) => void;
};

export function StepInfo({ user, state, onBack, onNext }: Props) {
  const [phone, setPhone] = useState(state.phone ?? "");
  const [dob, setDob] = useState(state.dob ?? "");
  const [pickupTime, setPickupTime] = useState(state.pickupTime ?? "09:00");
  const [returnTime, setReturnTime] = useState(state.returnTime ?? "17:00");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || !/^[0-9()+\-.\s]{7,20}$/.test(phone)) return setError("Enter a valid phone number.");
    if (!dob) return setError("Enter your date of birth.");

    const dobDate = new Date(dob);
    const ageYears = (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < 21) return setError("Renters must be at least 21 years old.");

    onNext({ phone, dob, pickupTime, returnTime });
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Signed in as <strong>{user.email}</strong>.
      </p>

      <div>
        <Label htmlFor="phone">Mobile phone</Label>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="(205) 555-0100"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">For pickup coordination.</p>
      </div>

      <div>
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob"
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">Must be 21 or older.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pickupTime">Pickup time</Label>
          <Input
            id="pickupTime"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="returnTime">Return time</Label>
          <Input
            id="returnTime"
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
