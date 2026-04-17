export const metadata = { title: "Cancellation policy" };

export default function CancellationPage() {
  return (
    <div className="container py-12 max-w-3xl prose prose-stone">
      <h1 className="font-display text-4xl font-bold mb-4">Cancellation policy</h1>
      <p className="text-muted-foreground mb-6">
        We know plans change. Here&apos;s how refunds work based on how far out you
        cancel.
      </p>
      <ul className="space-y-3">
        <li><strong>7+ days before pickup:</strong> full refund of your rental fee. Deposit authorization is released.</li>
        <li><strong>3–6 days before pickup:</strong> 50% refund of the rental fee. Deposit authorization is released.</li>
        <li><strong>Less than 72 hours before pickup:</strong> no refund. Deposit authorization is released.</li>
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        Weather-related cancellations for severe storms or evacuation orders are handled
        case-by-case — call us.
      </p>
    </div>
  );
}
