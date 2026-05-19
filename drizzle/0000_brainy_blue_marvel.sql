CREATE TYPE "public"."event_kind" AS ENUM('timed', 'all_day');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"color" varchar(32) DEFAULT '#7c3aed' NOT NULL,
	"timezone" varchar(80) DEFAULT 'Europe/Sofia' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"kind" "event_kind" NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"location" varchar(240),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"all_day_start" date,
	"all_day_end" date,
	"timezone" varchar(80) DEFAULT 'Europe/Sofia' NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_links" ADD CONSTRAINT "subscription_links_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "calendars_slug_idx" ON "calendars" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_calendar_idx" ON "events" USING btree ("calendar_id");--> statement-breakpoint
CREATE INDEX "events_timed_window_idx" ON "events" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "events_all_day_window_idx" ON "events" USING btree ("all_day_start","all_day_end");--> statement-breakpoint
CREATE INDEX "subscription_links_calendar_idx" ON "subscription_links" USING btree ("calendar_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_links_token_hash_idx" ON "subscription_links" USING btree ("token_hash");