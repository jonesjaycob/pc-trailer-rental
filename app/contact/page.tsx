import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="font-display text-4xl font-bold mb-4">Contact us</h1>
      <p className="text-muted-foreground mb-8">
        Questions about a rental, tow vehicle compatibility, or a damage claim? Reach out.
      </p>
      <div className="space-y-4">
        <div className="flex gap-3 items-start">
          <MapPin className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold">Pickup location</p>
            <p className="text-sm text-muted-foreground">Pell City, St. Clair County, AL</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <Phone className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold">Phone</p>
            <p className="text-sm text-muted-foreground">(205) 555-0100</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <Mail className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold">Email</p>
            <p className="text-sm text-muted-foreground">hello@pctrailers.test</p>
          </div>
        </div>
      </div>
    </div>
  );
}
