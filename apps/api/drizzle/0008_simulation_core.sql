ALTER TABLE "worlds" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 0;
ALTER TABLE "worlds" ADD COLUMN IF NOT EXISTS "simulation_seed" varchar(64);
UPDATE "worlds" SET "simulation_seed" = md5(random()::text || clock_timestamp()::text)
WHERE "simulation_seed" IS NULL;
ALTER TABLE "worlds" ALTER COLUMN "simulation_seed" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "relationship_history" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "world_id" integer NOT NULL REFERENCES "worlds"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "turn" integer NOT NULL,
  "source_type" varchar(32) NOT NULL,
  "source_id" integer,
  "delta" integer NOT NULL DEFAULT 0,
  "level_before" integer NOT NULL,
  "level_after" integer NOT NULL,
  "status_before" varchar(32) NOT NULL,
  "status_after" varchar(32) NOT NULL,
  "category" varchar(32) NOT NULL,
  "reason" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "simulation_turns" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "world_id" integer NOT NULL REFERENCES "worlds"("id") ON DELETE CASCADE,
  "turn" integer NOT NULL,
  "version" integer NOT NULL,
  "input_type" varchar(32) NOT NULL,
  "input_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "output_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "state_before" jsonb NOT NULL,
  "state_after" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "simulation_turns_world_turn_unique" UNIQUE ("world_id", "turn")
);
