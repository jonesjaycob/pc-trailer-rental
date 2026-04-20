import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { trailers } from "@/lib/db/schema";

// Revalidate hourly rather than at build time — the build can run without
// a working DB, and fresh trailer slugs appear within the hour.
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/fleet",
    "/about",
    "/contact",
    "/how-it-works",
    "/legal",
    "/legal/rental-agreement",
    "/legal/cancellation",
    "/legal/terms",
    "/legal/privacy",
  ];

  const now = new Date();
  const staticEntries = staticPaths.map((p) => ({
    url: `${BASE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  // Tolerate DB failures during build (e.g. in CI with no DATABASE_URL)
  let trailerEntries: MetadataRoute.Sitemap = [];
  try {
    const activeTrailers = await db
      .select({ slug: trailers.slug })
      .from(trailers)
      .where(eq(trailers.status, "active"));
    trailerEntries = activeTrailers.map((t) => ({
      url: `${BASE_URL}/fleet/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (err) {
    console.warn("[sitemap] DB unavailable, returning static entries only", err);
  }

  return [...staticEntries, ...trailerEntries];
}
