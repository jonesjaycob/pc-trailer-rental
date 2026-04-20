CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('pickup', 'return');--> statement-breakpoint
CREATE TYPE "public"."trailer_status" AS ENUM('active', 'maintenance', 'retired');--> statement-breakpoint
CREATE TYPE "public"."trailer_type" AS ENUM('camp_trailer', 'flatbed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trailer_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"pickup_time" text,
	"return_time" text,
	"pricing_breakdown" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"deposit_cents" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_deposit_intent_id" text,
	"rental_agreement_url" text,
	"signature_url" text,
	"pickup_inspection_id" uuid,
	"return_inspection_id" uuid,
	"cancel_reason" text,
	"cancelled_at" timestamp,
	"reminders_sent" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damage_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"line_items" jsonb NOT NULL,
	"total_cents" integer NOT NULL,
	"captured_payment_intent_id" text,
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"type" "inspection_type" NOT NULL,
	"mileage_or_hours" integer,
	"fuel_level" text,
	"notes" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signed_at" timestamp,
	"signature_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trailer_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"multiplier_bps" integer NOT NULL,
	"dow_mask" integer DEFAULT 127 NOT NULL,
	"trailer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"business_name" text DEFAULT 'Pell City Trailer Rentals' NOT NULL,
	"business_address" text DEFAULT 'Pell City, AL' NOT NULL,
	"business_phone" text,
	"business_email" text,
	"tax_rate_bps" integer DEFAULT 1000 NOT NULL,
	"business_hours_json" jsonb DEFAULT '{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"18:00"},"sat":{"open":"08:00","close":"18:00"},"sun":null}'::jsonb NOT NULL,
	"cancellation_policy_json" jsonb DEFAULT '{"fullRefundDaysOut":7,"partialRefundDaysOut":3,"partialRefundPct":50}'::jsonb NOT NULL,
	"deposit_release_business_days" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trailer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "trailer_type" NOT NULL,
	"description" text NOT NULL,
	"length_ft" integer NOT NULL,
	"width_ft" integer NOT NULL,
	"gvwr_lbs" integer NOT NULL,
	"empty_weight_lbs" integer NOT NULL,
	"tongue_weight_lbs" integer NOT NULL,
	"required_hitch_class" text NOT NULL,
	"sleeps" integer,
	"daily_rate_cents" integer NOT NULL,
	"weekend_rate_cents" integer NOT NULL,
	"weekly_rate_cents" integer NOT NULL,
	"security_deposit_cents" integer NOT NULL,
	"buffer_hours" integer DEFAULT 4 NOT NULL,
	"min_rental_days" integer DEFAULT 1 NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "trailer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trailer_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"hashed_password" text,
	"name" text,
	"phone" text,
	"dob" date,
	"address_json" jsonb,
	"image" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"drivers_license_url" text,
	"drivers_license_verified_at" timestamp,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_trailer_id_trailer_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."trailer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_claim" ADD CONSTRAINT "damage_claim_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_claim" ADD CONSTRAINT "damage_claim_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_block" ADD CONSTRAINT "maintenance_block_trailer_id_trailer_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."trailer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rule" ADD CONSTRAINT "pricing_rule_trailer_id_trailer_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."trailer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_trailer_dates_idx" ON "booking" USING btree ("trailer_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "booking_user_idx" ON "booking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "booking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_trailer_dates_idx" ON "maintenance_block" USING btree ("trailer_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "pricing_rule_dates_idx" ON "pricing_rule" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "trailer_status_idx" ON "trailer" USING btree ("status");