/**
 * Twilio SMS wrapper. Feature-flagged: if any of `TWILIO_ACCOUNT_SID`,
 * `TWILIO_AUTH_TOKEN`, or `TWILIO_FROM_NUMBER` is missing, `sendSms` is a
 * no-op (returns `{ skipped: true }`). Callers shouldn't have to care whether
 * SMS is enabled.
 */
import twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

const client = sid && token ? twilio(sid, token) : null;

export function smsEnabled() {
  return Boolean(client && from);
}

export async function sendSms({ to, body }: { to: string; body: string }) {
  if (!client || !from) {
    console.warn(`[sms] disabled; would have sent to ${to}: ${body.slice(0, 80)}`);
    return { sid: null, skipped: true as const };
  }
  if (!to) return { sid: null, skipped: true as const };

  try {
    const msg = await client.messages.create({ to, from, body });
    return { sid: msg.sid, skipped: false as const };
  } catch (err) {
    console.error("[sms] send failed", err);
    throw err;
  }
}
