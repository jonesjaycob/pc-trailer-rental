import type { Trailer } from "@/lib/db/schema";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/**
 * LocalBusiness JSON-LD for the Pell City Trailer Rentals homepage.
 * Replace address/phone/coords with real values before launch.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: "Pell City Trailer Rentals",
    description:
      "Camp trailer and flatbed utility trailer rentals in Pell City, Alabama.",
    url: BASE_URL,
    telephone: "+1-205-555-0100",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Pickup lot",
      addressLocality: "Pell City",
      addressRegion: "AL",
      postalCode: "35125",
      addressCountry: "US",
    },
    areaServed: [
      { "@type": "City", name: "Pell City" },
      { "@type": "AdministrativeArea", name: "St. Clair County" },
      { "@type": "State", name: "Alabama" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
  };
}

export function trailerJsonLd(trailer: Trailer) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: trailer.name,
    description: trailer.description,
    image: trailer.photos ?? [],
    brand: { "@type": "Brand", name: "Pell City Trailer Rentals" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (trailer.dailyRateCents / 100).toFixed(2),
      availability: trailer.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/fleet/${trailer.slug}`,
    },
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
