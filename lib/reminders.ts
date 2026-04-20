import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, trailers, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { sendSms, smsEnabled } from "@/lib/sms";
import { ReminderPickupEmail } from "@/emails/reminder-pickup";
import { ReminderReturnEmail } from "@/emails/reminder-return";

type ReminderKey = "pickup24h" | "returnDay";

type ReminderRow = {
  booking: typeof bookings.$inferSelect;
  trailer: typeof trailers.$inferSelect;
  user: typeof users.$inferSelect;
};

async function loadBookingsForDate(dateIso: string, column: "startDate" | "endDate") {
  return db
    .select({ booking: bookings, trailer: trailers, user: users })
    .from(bookings)
    .innerJoin(trailers, eq(bookings.trailerId, trailers.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(
      and(
        eq(bookings[column], dateIso),
        // only remind for bookings that are still in the active flow
        sql`${bookings.status} in ('confirmed', 'active')`
      )
    );
}

function alreadySent(row: ReminderRow, key: ReminderKey) {
  return Boolean(row.booking.remindersSent?.[key]);
}

async function markSent(bookingId: string, key: ReminderKey) {
  await db
    .update(bookings)
    .set({
      // jsonb concat: merge in { [key]: <timestamp> }
      remindersSent: sql`coalesce(${bookings.remindersSent}, '{}'::jsonb) || ${JSON.stringify(
        { [key]: new Date().toISOString() }
      )}::jsonb`,
    })
    .where(eq(bookings.id, bookingId));
}

/**
 * Sends a pickup reminder for each booking starting tomorrow that hasn't
 * already received one. Returns the count sent. Best-effort — individual
 * failures are logged and the run continues.
 */
export async function sendPickup24hReminders({ now = new Date() } = {}) {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const iso = tomorrow.toISOString().slice(0, 10);

  const rows = await loadBookingsForDate(iso, "startDate");
  let sent = 0;

  for (const row of rows) {
    if (alreadySent(row, "pickup24h")) continue;
    try {
      await sendEmail({
        to: row.user.email,
        subject: `Reminder: ${row.trailer.name} pickup tomorrow`,
        react: ReminderPickupEmail(row),
      });
      if (smsEnabled() && row.user.phone) {
        await sendSms({
          to: row.user.phone,
          body: `Pell City Trailers: Your ${row.trailer.name} pickup is tomorrow${
            row.booking.pickupTime ? ` at ${row.booking.pickupTime}` : ""
          }. Bring your license + proof of insurance. Reply STOP to opt out.`,
        });
      }
      await markSent(row.booking.id, "pickup24h");
      sent++;
    } catch (err) {
      console.error("[reminders] pickup24h failed", row.booking.id, err);
    }
  }
  return { sent, considered: rows.length };
}

/**
 * Sends a return reminder on the morning of each booking's return date.
 */
export async function sendReturnDayReminders({ now = new Date() } = {}) {
  const iso = now.toISOString().slice(0, 10);
  const rows = await loadBookingsForDate(iso, "endDate");
  let sent = 0;

  for (const row of rows) {
    if (alreadySent(row, "returnDay")) continue;
    try {
      await sendEmail({
        to: row.user.email,
        subject: `Return your trailer today: ${row.trailer.name}`,
        react: ReminderReturnEmail(row),
      });
      if (smsEnabled() && row.user.phone) {
        await sendSms({
          to: row.user.phone,
          body: `Pell City Trailers: Reminder to return ${row.trailer.name} today${
            row.booking.returnTime ? ` by ${row.booking.returnTime}` : ""
          }. Thanks! Reply STOP to opt out.`,
        });
      }
      await markSent(row.booking.id, "returnDay");
      sent++;
    } catch (err) {
      console.error("[reminders] returnDay failed", row.booking.id, err);
    }
  }
  return { sent, considered: rows.length };
}

