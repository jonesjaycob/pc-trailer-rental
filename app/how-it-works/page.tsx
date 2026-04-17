import { CalendarCheck, FileSignature, CreditCard, Truck } from "lucide-react";

export const metadata = { title: "How it works" };

const steps = [
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Pick your trailer and dates",
    body: "Browse the fleet, compare specs, and check live availability. Pickup and return happen at our Pell City lot.",
  },
  {
    icon: <FileSignature className="h-6 w-6" />,
    title: "Upload ID and sign",
    body: "Create an account, upload a photo of your driver's license, and sign the rental agreement — all from your phone.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Pay rental + authorize deposit",
    body: "Your rental fee is charged. The security deposit is authorized on your card (not charged) and released after return if there's no damage.",
  },
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Pick up and hit the road",
    body: "Meet us at the lot. We walk through the trailer, verify hitch connection, and send you on your way.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-3">How it works</h1>
      <p className="text-muted-foreground mb-10">
        From browse to road in about five minutes on your phone.
      </p>
      <ol className="space-y-6">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              {s.icon}
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg mb-1">
                {i + 1}. {s.title}
              </h2>
              <p className="text-muted-foreground text-sm">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
