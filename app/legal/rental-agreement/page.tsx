export const metadata = { title: "Rental agreement" };

export default function RentalAgreementPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-4">Rental agreement (summary)</h1>
      <p className="text-muted-foreground mb-6">
        The full rental agreement is generated for your booking and signed electronically
        at checkout. This page summarizes the key terms.
      </p>
      <div className="space-y-5">
        <Section title="Eligibility">
          Renter must be 21 or older with a valid driver&apos;s license. We verify ID at
          pickup.
        </Section>
        <Section title="Tow vehicle">
          You are responsible for using a properly rated tow vehicle and hitch. Each
          trailer lists required hitch class, GVWR, and tongue weight. We will not hand
          over a trailer to an unsafe rig.
        </Section>
        <Section title="Security deposit">
          A security deposit is authorized (not charged) on your card at booking. It is
          released within 5 business days of return if no damage is reported.
        </Section>
        <Section title="Damage and loss">
          Renter is responsible for damage beyond normal wear, cleaning beyond standard,
          and loss. Damage charges are applied against the deposit first, then invoiced.
        </Section>
        <Section title="Insurance">
          Your auto or RV insurance is primary. Bring proof at pickup for camp trailer
          rentals.
        </Section>
        <Section title="Smoking and pets">
          No smoking in camp trailers. Pets allowed in camp trailers with a $75 cleaning
          fee added at pickup.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5">
      <h2 className="font-display text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
