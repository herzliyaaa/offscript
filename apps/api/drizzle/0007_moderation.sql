CREATE TABLE IF NOT EXISTS "moderation_reports" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "world_id" integer NOT NULL REFERENCES "worlds"("id") ON DELETE CASCADE,
  "reporter_character_id" integer REFERENCES "characters"("id") ON DELETE SET NULL,
  "post_id" integer REFERENCES "posts"("id") ON DELETE CASCADE,
  "character_id" integer REFERENCES "characters"("id") ON DELETE CASCADE,
  "reason" varchar(64) NOT NULL,
  "details" text NOT NULL DEFAULT '',
  "status" varchar(32) NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "moderation_blocks" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "world_id" integer NOT NULL REFERENCES "worlds"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "blocked_character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "kind" varchar(16) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "moderation_blocks_unique" UNIQUE ("world_id", "character_id", "blocked_character_id", "kind")
);
