-- Migration 0002: Flow Metrics JSONB Redesign
-- Drops canonical_stage_mappings and adds JSONB config to flow_metrics_config

-- Step 1: Drop the canonical_stage_mappings table
DROP TABLE IF EXISTS "canonical_stage_mappings" CASCADE;

-- Step 2: Alter flow_metrics_config table
-- Remove the canonical_stage NOT NULL constraint (make it nullable for transition)
ALTER TABLE "flow_metrics_config" ALTER COLUMN "canonical_stage" DROP NOT NULL;

-- Add the config JSONB column
ALTER TABLE "flow_metrics_config" ADD COLUMN IF NOT EXISTS "config" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Step 3: Create GIN index for JSONB config
CREATE INDEX IF NOT EXISTS "idx_fmc_config_gin" ON "flow_metrics_config" USING GIN("config");

-- Step 4: Create validation function for JSONB config
CREATE OR REPLACE FUNCTION validate_metric_config_jsonb(config_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN config_data ? 'pipeline' 
       AND config_data ? 'startStage'
       AND config_data ? 'endStage'
       AND (config_data->'pipeline') ? 'id'
       AND (config_data->'pipeline') ? 'name'
       AND (config_data->'startStage') ? 'id'
       AND (config_data->'startStage') ? 'name'
       AND (config_data->'endStage') ? 'id'
       AND (config_data->'endStage') ? 'name';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add check constraint for config validation
ALTER TABLE "flow_metrics_config"
  ADD CONSTRAINT "check_valid_metric_config" 
  CHECK (
    config::text = '{}'::jsonb::text OR 
    validate_metric_config_jsonb(config)
  );

-- Step 6: Add comment for documentation
COMMENT ON COLUMN "flow_metrics_config"."config" IS 
  'JSONB configuration containing pipeline info, start/end stages, thresholds, and comments. Follows requests.line_items pattern.';
