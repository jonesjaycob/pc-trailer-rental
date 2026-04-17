import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? "Pell City Trailer Rentals <bookings@pctrailers.test>";

export type SendArgs = {
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments?: { filename: string; content: Buffer }[];
  from?: string;
};

export async function sendEmail(args: SendArgs) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set; skipping send to ${args.to} (${args.subject})`);
    return { id: null, skipped: true as const };
  }
  const { data, error } = await resend.emails.send({
    from: args.from ?? DEFAULT_FROM,
    to: args.to,
    subject: args.subject,
    react: args.react,
    attachments: args.attachments,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return { id: data?.id ?? null, skipped: false as const };
}
