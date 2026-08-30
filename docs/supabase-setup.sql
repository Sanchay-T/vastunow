-- VastuNow Supabase setup
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (idempotent).

-- 1. Main table (schema from docs/DATABASE-AND-INFRA.md, plus the cost columns
--    the score route inserts: cost_usd, cost_breakdown)
CREATE TABLE IF NOT EXISTS analyses (
    id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at        TIMESTAMPTZ  DEFAULT now(),
    image_url         TEXT         NOT NULL,
    facing_direction  TEXT         NOT NULL,
    language          TEXT         DEFAULT 'en',
    parsed_floorplan  JSONB,
    user_corrections  JSONB,
    vastu_analysis    JSONB,
    overall_score     INTEGER,
    grade             TEXT,
    report_content    JSONB,
    report_language   TEXT         DEFAULT 'en',
    ip_hash           TEXT,
    user_agent        TEXT,
    cost_usd          NUMERIC,
    cost_breakdown    JSONB
);

-- 2. Lock the table down: the app only touches it server-side with the
--    service role key (which bypasses RLS), so no public policies are needed.
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 3. Public storage bucket for uploaded floor plan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('floorplans', 'floorplans', true)
ON CONFLICT (id) DO NOTHING;
