-- Migration 022: Flow Metrics Cross-Pipeline Support
-- Updates JSONB validation to support cross-pipeline metrics
-- Each stage now has its own pipelineId and pipelineName

-- Step 1: Drop the old constraint
ALTER TABLE flow_metrics_config DROP CONSTRAINT IF EXISTS check_valid_metric_config;

-- Step 2: Update validation function for cross-pipeline metrics
CREATE OR REPLACE FUNCTION validate_metric_config_jsonb(config_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow empty config
    IF config_data = '{}'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    -- Validate structure for cross-pipeline metrics
    -- Each stage must have: id, name, pipelineId, pipelineName
    RETURN config_data ? 'startStage'
       AND config_data ? 'endStage'
       AND (config_data->'startStage') ? 'id'
       AND (config_data->'startStage') ? 'name'
       AND (config_data->'startStage') ? 'pipelineId'
       AND (config_data->'startStage') ? 'pipelineName'
       AND (config_data->'endStage') ? 'id'
       AND (config_data->'endStage') ? 'name'
       AND (config_data->'endStage') ? 'pipelineId'
       AND (config_data->'endStage') ? 'pipelineName';
END;
$$ LANGUAGE plpgsql;

-- Step 3: Re-add check constraint with updated validation
ALTER TABLE flow_metrics_config
  ADD CONSTRAINT check_valid_metric_config 
  CHECK (validate_metric_config_jsonb(config));

-- Step 4: Update column comment
COMMENT ON COLUMN flow_metrics_config.config IS 
  'JSONB configuration with cross-pipeline support. Structure: {"startStage": {"id", "name", "pipelineId", "pipelineName"}, "endStage": {...}, "thresholds": {"minDays", "maxDays"}, "comment": "..."}';
