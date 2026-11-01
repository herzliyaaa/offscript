ALTER TABLE "characters" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "gender" varchar(64);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "additional_description" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "follower_count" integer DEFAULT 0 NOT NULL;