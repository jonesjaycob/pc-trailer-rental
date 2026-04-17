import Link from "next/link";

export const metadata = { title: "Policies" };

const links = [
  { href: "/legal/rental-agreement", label: "Rental agreement", body: "The full terms you'll sign before pickup." },
  { href: "/legal/cancellation", label: "Cancellation policy", body: "Full, partial, and no-refund windows." },
  { href: "/legal/terms", label: "Terms of service", body: "Using this website." },
  { href: "/legal/privacy", label: "Privacy", body: "How we handle your data." },
];

export default function LegalIndex() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-6">Policies</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border p-5 hover:border-primary transition-colors"
          >
            <p className="font-semibold mb-1">{l.label}</p>
            <p className="text-sm text-muted-foreground">{l.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
