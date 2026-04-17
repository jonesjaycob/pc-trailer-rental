import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)");
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)");

export const createBookingSchema = z.object({
  trailerId: z.string().uuid(),
  startDate: dateString,
  endDate: dateString,
  pickupTime: timeString.optional(),
  returnTime: timeString.optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const availabilityQuerySchema = z.object({
  trailerId: z.string().uuid(),
  windowStart: dateString.optional(),
  windowEnd: dateString.optional(),
});

export const finalizeBookingSchema = z.object({
  phone: z.string().regex(/^[0-9()+\-.\s]{7,20}$/),
  dob: dateString,
  driversLicenseUrl: z.string().url(),
  signatureDataUrl: z
    .string()
    .regex(/^data:image\/png;base64,/, "Signature must be a PNG data URL"),
  agreementAccepted: z.literal(true),
});
export type FinalizeBookingInput = z.infer<typeof finalizeBookingSchema>;
