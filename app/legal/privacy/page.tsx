export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-4">Privacy</h1>
      <p className="text-muted-foreground">
        We collect the minimum data needed to run your rental: name, contact info,
        driver&apos;s license photo (stored encrypted and deleted when you delete your
        account), payment details processed by Stripe, and booking history. Placeholder
        page — replace with the final privacy policy before launch.
      </p>
    </div>
  );
}
