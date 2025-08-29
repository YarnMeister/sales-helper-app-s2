-- Migration 018: Add threshold and comment fields to flow metrics
-- This migration adds avg_min_days, avg_max_days, and metric_comment to canonical_stage_mappings

-- Add new columns to canonical_stage_mappings table
ALTER TABLE canonical_stage_mappings 
ADD COLUMN IF NOT EXISTS avg_min_days INTEGER,
ADD COLUMN IF NOT EXISTS avg_max_days INTEGER,
ADD COLUMN IF NOT EXISTS metric_comment TEXT;

-- Add validation constraint to ensure avg_min_days <= avg_max_days when both are set
ALTER TABLE canonical_stage_mappings 
ADD CONSTRAINT IF NOT EXISTS check_avg_thresholds 
CHECK (
  (avg_min_days IS NULL AND avg_max_days IS NULL) OR
  (avg_min_days IS NOT NULL AND avg_max_days IS NOT NULL AND avg_min_days <= avg_max_days)
);

-- Add comments for documentation
COMMENT ON COLUMN canonical_stage_mappings.avg_min_days IS 'Minimum threshold in days for green color coding (excellent performance)';
COMMENT ON COLUMN canonical_stage_mappings.avg_max_days IS 'Maximum threshold in days for red color coding (needs attention)';
COMMENT ON COLUMN canonical_stage_mappings.metric_comment IS 'Narrative or interpretation about the current metric performance';
