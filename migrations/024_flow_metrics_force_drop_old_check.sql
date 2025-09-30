-- Migration 024: Force-drop old function-based CHECK and add inline JSONB CHECK

-- Step 1: Drop any CHECK constraints on flow_metrics_config that reference validate_metric_config_jsonb
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'flow_metrics_config'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%validate_metric_config_jsonb%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.flow_metrics_config DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Step 2: Drop the old function if it still exists
DROP FUNCTION IF EXISTS validate_metric_config_jsonb(JSONB) CASCADE;

-- Step 3: Add inline JSONB CHECK constraint validating cross-pipeline structure
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
