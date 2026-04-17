import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  date,
  primaryKey,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ---------- Enums ---------- */

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const trailerTypeEnum = pgEnum("trailer_type", ["camp_trailer", "flatbed"]);
export const trailerStatusEnum = pgEnum("trailer_status", ["active", "maintenance", "retired"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
]);
export const inspectionTypeEnum = pgEnum("inspection_type", ["pickup", "return"]);

/* ---------- Auth.js tables ---------- */

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  hashedPassword: text("hashed_password"),
  name: text("name"),
  phone: text("phone"),
  dob: date("dob"),
  addressJson: jsonb("address_json"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("customer"),
  driversLicenseUrl: text("drivers_license_url"),
  driversLicenseVerifiedAt: timestamp("drivers_license_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

/* ---------- Business tables ---------- */

export const trailers = pgTable(
  "trailer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: trailerTypeEnum("type").notNull(),
    description: text("description").notNull(),
    lengthFt: integer("length_ft").notNull(),
    widthFt: integer("width_ft").notNull(),
    gvwrLbs: integer("gvwr_lbs").notNull(),
    emptyWeightLbs: integer("empty_weight_lbs").notNull(),
    tongueWeightLbs: integer("tongue_weight_lbs").notNull(),
    requiredHitchClass: text("required_hitch_class").notNull(),
    sleeps: integer("sleeps"),
    dailyRateCents: integer("daily_rate_cents").notNull(),
    weekendRateCents: integer("weekend_rate_cents").notNull(),
    weeklyRateCents: integer("weekly_rate_cents").notNull(),
    securityDepositCents: integer("security_deposit_cents").notNull(),
    bufferHours: integer("buffer_hours").notNull().default(4),
    minRentalDays: integer("min_rental_days").notNull().default(1),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    status: trailerStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("trailer_status_idx").on(t.status)]
);

export const bookings = pgTable(
  "booking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    trailerId: uuid("trailer_id")
      .notNull()
      .references(() => trailers.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    pickupTime: text("pickup_time"),
    returnTime: text("return_time"),
    pricingBreakdown: jsonb("pricing_breakdown").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    depositCents: integer("deposit_cents").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeDepositIntentId: text("stripe_deposit_intent_id"),
    rentalAgreementUrl: text("rental_agreement_url"),
    signatureUrl: text("signature_url"),
    pickupInspectionId: uuid("pickup_inspection_id"),
    returnInspectionId: uuid("return_inspection_id"),
    cancelReason: text("cancel_reason"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("booking_trailer_dates_idx").on(t.trailerId, t.startDate, t.endDate),
    index("booking_user_idx").on(t.userId),
    index("booking_status_idx").on(t.status),
  ]
);

export const inspections = pgTable("inspection", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  type: inspectionTypeEnum("type").notNull(),
  mileageOrHours: integer("mileage_or_hours"),
  fuelLevel: text("fuel_level"),
  notes: text("notes"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  signedAt: timestamp("signed_at"),
  signatureUrl: text("signature_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const maintenanceBlocks = pgTable(
  "maintenance_block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trailerId: uuid("trailer_id")
      .notNull()
      .references(() => trailers.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("maintenance_trailer_dates_idx").on(t.trailerId, t.startDate, t.endDate)]
);

export const auditLogs = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Singleton settings row (id=1). Stores tax rate, business hours, cancellation
 * policy, and deposit release window. Admin-editable in Phase 3.
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull().default("Pell City Trailer Rentals"),
  businessAddress: text("business_address").notNull().default("Pell City, AL"),
  businessPhone: text("business_phone"),
  businessEmail: text("business_email"),
  taxRateBps: integer("tax_rate_bps").notNull().default(1000), // 10.00% in basis points
  businessHoursJson: jsonb("business_hours_json")
    .$type<Record<string, { open: string; close: string } | null>>()
    .notNull()
    .default({
      mon: { open: "08:00", close: "18:00" },
      tue: { open: "08:00", close: "18:00" },
      wed: { open: "08:00", close: "18:00" },
      thu: { open: "08:00", close: "18:00" },
      fri: { open: "08:00", close: "18:00" },
      sat: { open: "08:00", close: "18:00" },
      sun: null,
    }),
  cancellationPolicyJson: jsonb("cancellation_policy_json")
    .$type<{ fullRefundDaysOut: number; partialRefundDaysOut: number; partialRefundPct: number }>()
    .notNull()
    .default({ fullRefundDaysOut: 7, partialRefundDaysOut: 3, partialRefundPct: 50 }),
  depositReleaseBusinessDays: integer("deposit_release_business_days").notNull().default(5),
});

/* ---------- Relations ---------- */

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const trailersRelations = relations(trailers, ({ many }) => ({
  bookings: many(bookings),
  maintenanceBlocks: many(maintenanceBlocks),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  trailer: one(trailers, { fields: [bookings.trailerId], references: [trailers.id] }),
  inspections: many(inspections),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  booking: one(bookings, { fields: [inspections.bookingId], references: [bookings.id] }),
}));

/* ---------- Types ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Trailer = typeof trailers.$inferSelect;
export type NewTrailer = typeof trailers.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type MaintenanceBlock = typeof maintenanceBlocks.$inferSelect;
export type Settings = typeof settings.$inferSelect;
