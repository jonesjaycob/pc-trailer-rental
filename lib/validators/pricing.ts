import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)");

export const pricingRuleSchema = z
  .object({
    label: z.string().min(2).max(100),
    startDate: dateString,
    endDate: dateString,
    multiplierBps: z.coerce.number().int().min(1000).max(50000),
    dowMask: z.coerce.number().int().min(0).max(127).default(127),
    trailerId: z.string().uuid().nullable().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });
export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;

export const damageClaimSchema = z.object({
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(2).max(200),
        amountCents: z.coerce.number().int().min(1),
      })
    )
    .min(1, "At least one line item required"),
});
export type DamageClaimInput = z.infer<typeof damageClaimSchema>;
