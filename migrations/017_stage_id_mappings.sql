-- Migration 017: Update Canonical Stage Mappings to Use Stage IDs
-- This migration adds stage ID columns and updates the schema for stage ID-based mappings

-- Add new columns for stage IDs
ALTER TABLE canonical_stage_mappings 
ADD COLUMN start_stage_id INTEGER,
ADD COLUMN end_stage_id INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings(start_stage_id);
CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings(end_stage_id);

-- Add constraint to ensure at least one mapping method is provided
ALTER TABLE canonical_stage_mappings 
ADD CONSTRAINT check_stage_mapping_method 
CHECK (
  (start_stage_id IS NOT NULL AND end_stage_id IS NOT NULL) OR
  (start_stage IS NOT NULL AND end_stage IS NOT NULL)
);

-- Add comments for documentation
COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)';
COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)';

-- Update existing table comments
COMMENT ON TABLE canonical_stage_mappings IS 'Maps canonical stages to Pipedrive stage IDs for lead time analysis. Stage IDs are preferred over stage names for accuracy.';
