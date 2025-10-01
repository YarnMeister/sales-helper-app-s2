-- Migration 023: Flow Metrics Inline JSONB CHECK (Cross-Pipeline Support)
-- Replace function-based validation with inline JSONB CHECK

-- Step 1: Drop existing CHECK constraint and validation function (if present)
ALTER TABLE flow_metrics_config DROP CONSTRAINT IF EXISTS check_valid_metric_config;
DROP FUNCTION IF EXISTS validate_metric_config_jsonb(JSONB) CASCADE;

-- Step 2: Add inline CHECK constraint validating cross-pipeline structure
-- Allows empty '{}' config, or requires required keys on startStage/endStage
ALTER TABLE flow_metrics_config
  ADD CONSTRAINT check_valid_metric_config
  CHECK (
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
  );

-- Step 3: Document column structure
COMMENT ON COLUMN flow_metrics_config.config IS 'JSONB configuration with cross-pipeline support. Required keys: startStage{id,name,pipelineId,pipelineName}, endStage{id,name,pipelineId,pipelineName}. Optional: thresholds{minDays,maxDays}, comment.';
