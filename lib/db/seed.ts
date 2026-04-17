import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Seeding settings...");
  await db
    .insert(schema.settings)
    .values({ id: 1 })
    .onConflictDoNothing({ target: schema.settings.id });

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pctrailers.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      hashedPassword,
      name: "Pell City Admin",
      role: "admin",
      emailVerified: new Date(),
    })
    .onConflictDoNothing({ target: schema.users.email });

  console.log("Seeding trailers...");
  const trailers: schema.NewTrailer[] = [
    {
      slug: "wanderer-24",
      name: "The Wanderer 24'",
      type: "camp_trailer",
      description:
        "A 24-foot travel trailer that sleeps 6. Fully self-contained with a queen bed, dinette, kitchenette with 3-burner stove and fridge, and a wet bath. Perfect for family getaways to Lake Logan Martin or the Smokies.",
      lengthFt: 24,
      widthFt: 8,
      gvwrLbs: 6500,
      emptyWeightLbs: 4800,
      tongueWeightLbs: 520,
      requiredHitchClass: "Class III (2\" receiver, 5,000+ lb tow rating)",
      sleeps: 6,
      dailyRateCents: 14500,
      weekendRateCents: 27500,
      weeklyRateCents: 87500,
      securityDepositCents: 50000,
      bufferHours: 24,
      minRentalDays: 2,
      photos: [
        "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200",
        "https://images.unsplash.com/photo-1533873984035-25970ab07461?w=1200",
      ],
    },
    {
      slug: "bunkhouse-28",
      name: "The Bunkhouse 28'",
      type: "camp_trailer",
      description:
        "28-foot bunkhouse trailer sleeps 8. Queen master, bunk beds in the rear, full kitchen, dry bath with shower, and an outdoor awning. Great for bigger groups.",
      lengthFt: 28,
      widthFt: 8,
      gvwrLbs: 7800,
      emptyWeightLbs: 5900,
      tongueWeightLbs: 680,
      requiredHitchClass: "Class IV (2\" receiver, 7,500+ lb tow rating)",
      sleeps: 8,
      dailyRateCents: 18500,
      weekendRateCents: 34500,
      weeklyRateCents: 109000,
      securityDepositCents: 75000,
      bufferHours: 24,
      minRentalDays: 2,
      photos: [
        "https://images.unsplash.com/photo-1500930540546-25cd8cbf21aa?w=1200",
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200",
      ],
    },
    {
      slug: "flatbed-16",
      name: "16' Utility Flatbed",
      type: "flatbed",
      description:
        "Bumper-pull 16-foot flatbed with a 7,000 lb GVWR. Dovetail tail with ramps, stake pockets, D-rings. Ideal for hauling equipment, mowers, UTVs, or furniture.",
      lengthFt: 16,
      widthFt: 7,
      gvwrLbs: 7000,
      emptyWeightLbs: 2100,
      tongueWeightLbs: 420,
      requiredHitchClass: "Class III (2\" receiver, 5,000+ lb tow rating)",
      sleeps: null,
      dailyRateCents: 7500,
      weekendRateCents: 13500,
      weeklyRateCents: 39500,
      securityDepositCents: 30000,
      bufferHours: 2,
      minRentalDays: 1,
      photos: [
        "https://images.unsplash.com/photo-1597766353939-5e70d8f1a38c?w=1200",
      ],
    },
    {
      slug: "flatbed-20-gooseneck",
      name: "20' Gooseneck Flatbed",
      type: "flatbed",
      description:
        "20-foot gooseneck flatbed with 14,000 lb GVWR. Dual tandem axles with electric brakes, stake pockets, and slide-in ramps. Requires a gooseneck hitch in your truck bed.",
      lengthFt: 20,
      widthFt: 8,
      gvwrLbs: 14000,
      emptyWeightLbs: 3800,
      tongueWeightLbs: 1100,
      requiredHitchClass: "Gooseneck (25k lb truck bed ball)",
      sleeps: null,
      dailyRateCents: 12500,
      weekendRateCents: 22500,
      weeklyRateCents: 69500,
      securityDepositCents: 50000,
      bufferHours: 2,
      minRentalDays: 1,
      photos: [
        "https://images.unsplash.com/photo-1605152276897-4f618f831968?w=1200",
      ],
    },
  ];

  for (const t of trailers) {
    await db.insert(schema.trailers).values(t).onConflictDoNothing({ target: schema.trailers.slug });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
