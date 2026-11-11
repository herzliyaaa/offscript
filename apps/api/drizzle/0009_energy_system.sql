ALTER TABLE "worlds" ADD COLUMN "energy_bonus_units" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "energy_used_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "energy_date" varchar(10) DEFAULT '1970-01-01' NOT NULL;