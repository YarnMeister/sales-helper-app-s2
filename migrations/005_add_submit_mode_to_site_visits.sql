-- Migration 005: Add submit_mode field to site_visits table
-- This field tracks whether the check-in was submitted in mock or live mode

-- Add submit_mode column with default value
ALTER TABLE site_visits 
ADD COLUMN IF NOT EXISTS submit_mode TEXT NOT NULL DEFAULT 'live';

-- Add constraint to ensure valid values
ALTER TABLE site_visits 
ADD CONSTRAINT check_submit_mode_valid 
CHECK (submit_mode IN ('mock', 'live'));

-- Add comment
COMMENT ON COLUMN site_visits.submit_mode IS 'Whether the check-in was submitted in mock or live mode';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_site_visits_submit_mode ON site_visits(submit_mode);
