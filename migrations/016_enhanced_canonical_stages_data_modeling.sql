-- Migration 016: Enhanced Canonical Stages Data Modeling
-- This migration creates a unified metrics management system

-- Create flow_metrics_config table
CREATE TABLE IF NOT EXISTS flow_metrics_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT UNIQUE NOT NULL,           -- 'lead-conversion', 'quote-conversion', etc.
  display_title TEXT NOT NULL,               -- 'Lead Conversion Time', 'Quote Conversion Time'
  canonical_stage TEXT NOT NULL,             -- 'Lead Conversion', 'Quote Conversion'
  sort_order INTEGER NOT NULL DEFAULT 0,     -- For ordering on main page
  is_active BOOLEAN NOT NULL DEFAULT true,   -- Whether to show on main page
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fmc_metric_key ON flow_metrics_config(metric_key);
CREATE INDEX IF NOT EXISTS idx_fmc_sort_order ON flow_metrics_config(sort_order);
CREATE INDEX IF NOT EXISTS idx_fmc_is_active ON flow_metrics_config(is_active);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flow_metrics_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flow_metrics_config_updated_at
  BEFORE UPDATE ON flow_metrics_config
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_metrics_config_updated_at();

-- Insert default metrics configuration (migrating from hardcoded data)
INSERT INTO flow_metrics_config (metric_key, display_title, canonical_stage, sort_order, is_active) VALUES
  ('lead-conversion', 'Lead Conversion Time', 'Lead Conversion', 1, true),
  ('quote-conversion', 'Quote Conversion Time', 'Quote Conversion', 2, true),
  ('order-conversion', 'Order Conversion Time', 'Order Conversion', 3, true),
  ('procurement', 'Procurement Lead Time', 'Procurement', 4, true),
  ('manufacturing', 'Manufacturing Lead Time', 'Manufacturing', 5, true),
  ('delivery', 'Delivery Lead Time', 'Delivery', 6, true)
ON CONFLICT (metric_key) DO NOTHING;

-- Add foreign key relationship to canonical_stage_mappings
ALTER TABLE canonical_stage_mappings 
ADD COLUMN IF NOT EXISTS metric_config_id UUID REFERENCES flow_metrics_config(id);

-- Add unique constraint to ensure one mapping per metric
ALTER TABLE canonical_stage_mappings 
ADD CONSTRAINT IF NOT EXISTS unique_metric_mapping UNIQUE (metric_config_id);

-- Update existing mappings to reference the new config
UPDATE canonical_stage_mappings 
SET metric_config_id = (
  SELECT id FROM flow_metrics_config 
  WHERE canonical_stage = canonical_stage_mappings.canonical_stage
  LIMIT 1
)
WHERE metric_config_id IS NULL;

-- Add comments for documentation
COMMENT ON TABLE flow_metrics_config IS 'Configuration for flow metrics displayed on the main reporting page';
COMMENT ON COLUMN flow_metrics_config.metric_key IS 'Unique identifier for the metric (e.g., lead-conversion)';
COMMENT ON COLUMN flow_metrics_config.display_title IS 'Human-readable title for the metric';
COMMENT ON COLUMN flow_metrics_config.canonical_stage IS 'The canonical stage name for this metric';
COMMENT ON COLUMN flow_metrics_config.sort_order IS 'Order in which metrics appear on the main page';
COMMENT ON COLUMN flow_metrics_config.is_active IS 'Whether this metric is displayed on the main page';
