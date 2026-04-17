import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("Running Drizzle migrations...");
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });

  console.log("Applying post-migrations (extensions, exclusion constraint)...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS btree_gist`);

  // Enforce no-overlap at DB level for active bookings on the same trailer.
  // Half-open [start, end) range; only blocking statuses count.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap'
      ) THEN
        ALTER TABLE booking
          ADD CONSTRAINT booking_no_overlap
          EXCLUDE USING gist (
            trailer_id WITH =,
            daterange(start_date, end_date, '[)') WITH &&
          )
          WHERE (status IN ('pending', 'confirmed', 'active'));
      END IF;
    END
    $$;
  `);

  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
