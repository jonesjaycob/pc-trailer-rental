export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-4">About</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Pell City Trailer Rentals is a family-run operation in St. Clair County, Alabama.
        We rent camp trailers for lake trips and family getaways, plus flatbed utility
        trailers for the jobs that need hauling.
      </p>
      <p className="text-muted-foreground mb-6">
        We started because too many trips started with a phone call to an unanswered
        number. Every trailer on our lot is online, bookable 24/7, with live dates and no
        guessing. Pickup is at our Pell City location. We walk you through the trailer,
        verify the hitch connection, and send you on your way.
      </p>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">What we believe</h2>
      <ul className="space-y-3 text-muted-foreground">
        <li><strong className="text-foreground">Clean trailers.</strong> Every unit is inspected and washed between rentals.</li>
        <li><strong className="text-foreground">Honest pricing.</strong> Taxes and fees are shown up front.</li>
        <li><strong className="text-foreground">Safe towing.</strong> We won&apos;t hand over a trailer to a tow vehicle that isn&apos;t rated for it.</li>
      </ul>
    </div>
  );
}
