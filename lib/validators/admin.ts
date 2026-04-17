import { z } from "zod";

export const bookingActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("mark_picked_up") }),
  z.object({ action: z.literal("mark_returned") }),
  z.object({
    action: z.literal("capture_deposit"),
    amountCents: z.number().int().min(0),
    reason: z.string().min(3).max(500),
  }),
  z.object({ action: z.literal("release_deposit") }),
]);
export type BookingAction = z.infer<typeof bookingActionSchema>;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const maintenanceBlockSchema = z
  .object({
    trailerId: z.string().uuid(),
    startDate: dateString,
    endDate: dateString,
    reason: z.string().max(200).optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });
export type MaintenanceBlockInput = z.infer<typeof maintenanceBlockSchema>;

export const inspectionSchema = z.object({
  type: z.enum(["pickup", "return"]),
  mileageOrHours: z.coerce.number().int().min(0).optional(),
  fuelLevel: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(20),
  signatureDataUrl: z
    .string()
    .regex(/^data:image\/png;base64,/, "Signature must be a PNG data URL")
    .optional(),
});
export type InspectionInput = z.infer<typeof inspectionSchema>;
