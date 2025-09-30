-- Migration 025: Drop-and-replace CHECK for flow metrics JSONB

-- Step 1: Unconditionally drop the existing CHECK and function
ALTER TABLE public.flow_metrics_config DROP CONSTRAINT IF EXISTS check_valid_metric_config;
DROP FUNCTION IF EXISTS validate_metric_config_jsonb(JSONB) CASCADE;

-- Step 2: Add inline JSONB CHECK for cross-pipeline structure
ALTER TABLE public.flow_metrics_config
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
