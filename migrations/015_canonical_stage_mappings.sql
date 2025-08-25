-- Migration 015: Add canonical stage mappings table
-- This migration creates a table to store mappings between canonical stages and Pipedrive stages

-- Canonical stage mappings table
CREATE TABLE IF NOT EXISTS canonical_stage_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_stage TEXT NOT NULL,
  start_stage TEXT NOT NULL,
  end_stage TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_csm_canonical_stage ON canonical_stage_mappings(canonical_stage);
CREATE INDEX IF NOT EXISTS idx_csm_start_stage ON canonical_stage_mappings(start_stage);
CREATE INDEX IF NOT EXISTS idx_csm_end_stage ON canonical_stage_mappings(end_stage);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_canonical_stage_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canonical_stage_mappings_updated_at
  BEFORE UPDATE ON canonical_stage_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_canonical_stage_mappings_updated_at();

-- Insert default Order Conversion mapping
INSERT INTO canonical_stage_mappings (canonical_stage, start_stage, end_stage)
VALUES ('Order Conversion', 'Order Received - Johan', 'Quality Control')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE canonical_stage_mappings IS 'Maps canonical stages to Pipedrive stage names for lead time analysis';
COMMENT ON COLUMN canonical_stage_mappings.canonical_stage IS 'The canonical stage name (e.g., Order Conversion)';
COMMENT ON COLUMN canonical_stage_mappings.start_stage IS 'The Pipedrive stage name that marks the start of this canonical stage';
COMMENT ON COLUMN canonical_stage_mappings.end_stage IS 'The Pipedrive stage name that marks the end of this canonical stage';
