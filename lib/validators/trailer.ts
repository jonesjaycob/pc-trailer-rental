import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const trailerSchema = z.object({
  slug: z.string().regex(slugRegex, "Slug: lowercase letters, numbers, hyphens only").max(60),
  name: z.string().min(2).max(100),
  type: z.enum(["camp_trailer", "flatbed"]),
  description: z.string().min(10).max(2000),
  lengthFt: z.coerce.number().int().min(4).max(60),
  widthFt: z.coerce.number().int().min(4).max(12),
  gvwrLbs: z.coerce.number().int().min(500).max(40000),
  emptyWeightLbs: z.coerce.number().int().min(200).max(30000),
  tongueWeightLbs: z.coerce.number().int().min(50).max(5000),
  requiredHitchClass: z.string().min(3).max(100),
  sleeps: z.coerce.number().int().min(0).max(20).optional().nullable(),
  dailyRateCents: z.coerce.number().int().min(0),
  weekendRateCents: z.coerce.number().int().min(0),
  weeklyRateCents: z.coerce.number().int().min(0),
  securityDepositCents: z.coerce.number().int().min(0),
  bufferHours: z.coerce.number().int().min(0).max(168).default(4),
  minRentalDays: z.coerce.number().int().min(1).max(30).default(1),
  photos: z.array(z.string().url()).default([]),
  status: z.enum(["active", "maintenance", "retired"]).default("active"),
});
export type TrailerInput = z.infer<typeof trailerSchema>;
