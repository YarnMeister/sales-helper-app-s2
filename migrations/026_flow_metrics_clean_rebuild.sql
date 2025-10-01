-- Migration 026: Clean rebuild of flow_metrics_config table
-- Drop and recreate with minimal, correct schema for cross-pipeline metrics

-- Step 1: Drop the entire table and any dependent objects
DROP TABLE IF EXISTS flow_metrics_config CASCADE;

-- Step 2: Recreate table with clean schema
CREATE TABLE flow_metrics_config (
  id SERIAL PRIMARY KEY,
  metric_key TEXT NOT NULL UNIQUE,
  display_title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Inline CHECK constraint for cross-pipeline JSONB structure
  CONSTRAINT check_valid_metric_config CHECK (
    config = '{}'::jsonb OR (
      (config ? 'startStage') AND (config ? 'endStage') AND
      ((config->'startStage') ? 'id') AND
      ((config->'startStage') ? 'name') AND
      ((config->'startStage') ? 'pipelineId') AND
      ((config->'startStage') ? 'pipelineName') AND
      ((config->'endStage') ? 'id') AND
      ((config->'endStage') ? 'name') AND
      ((config->'endStage') ? 'pipelineId') AND
      ((config->'endStage') ? 'pipelineName')
    )
  )
);

-- Step 3: Add indexes
CREATE INDEX idx_flow_metrics_config_metric_key ON flow_metrics_config(metric_key);
CREATE INDEX idx_flow_metrics_config_is_active ON flow_metrics_config(is_active);
CREATE INDEX idx_flow_metrics_config_sort_order ON flow_metrics_config(sort_order);
CREATE INDEX idx_flow_metrics_config_gin ON flow_metrics_config USING GIN(config);

-- Step 4: Add helpful comments
COMMENT ON TABLE flow_metrics_config IS 'Flow metrics configuration with cross-pipeline support';
COMMENT ON COLUMN flow_metrics_config.metric_key IS 'Unique kebab-case identifier (e.g., lead-to-quote)';
COMMENT ON COLUMN flow_metrics_config.config IS 'JSONB config: {startStage:{id,name,pipelineId,pipelineName}, endStage:{...}, thresholds:{minDays?,maxDays?}, comment?}';

