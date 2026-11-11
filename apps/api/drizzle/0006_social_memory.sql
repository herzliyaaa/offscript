ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "memory" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "goals" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "mood" varchar(64) NOT NULL DEFAULT 'curious';
ALTER TABLE "relationships" ADD COLUMN IF NOT EXISTS "category" varchar(32) NOT NULL DEFAULT 'neutral';
