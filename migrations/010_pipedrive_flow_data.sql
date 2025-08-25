-- Migration 010: Add Pipedrive flow data tables for lead time analysis
-- This migration creates tables to store Pipedrive deal flow data for metrics analysis

-- Core table for storing Pipedrive deal flow data
CREATE TABLE IF NOT EXISTS pipedrive_deal_flow_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id BIGINT NOT NULL,
  pipeline_id BIGINT NOT NULL,
  stage_id BIGINT NOT NULL,
  stage_name TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal metadata table for tracking fetched deals
CREATE TABLE IF NOT EXISTS pipedrive_metric_data (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  pipeline_id BIGINT NOT NULL,
  stage_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  first_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data(deal_id);
CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data(entered_at);
CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data(stage_id);
CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data(created_at);

-- Create trigger to auto-update updated_at timestamp for flow data
CREATE OR REPLACE FUNCTION update_pipedrive_deal_flow_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pipedrive_deal_flow_data_updated_at
  BEFORE UPDATE ON pipedrive_deal_flow_data
  FOR EACH ROW
  EXECUTE FUNCTION update_pipedrive_deal_flow_data_updated_at();

-- Add comments for documentation
COMMENT ON TABLE pipedrive_deal_flow_data IS 'Stores Pipedrive deal flow data for lead time analysis';
COMMENT ON COLUMN pipedrive_deal_flow_data.deal_id IS 'Pipedrive deal ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.pipeline_id IS 'Pipedrive pipeline ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.stage_id IS 'Pipedrive stage ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.stage_name IS 'Human-readable stage name';
COMMENT ON COLUMN pipedrive_deal_flow_data.entered_at IS 'When the deal entered this stage';
COMMENT ON COLUMN pipedrive_deal_flow_data.left_at IS 'When the deal left this stage (NULL if still in stage)';
COMMENT ON COLUMN pipedrive_deal_flow_data.duration_seconds IS 'Duration in seconds spent in this stage';

COMMENT ON TABLE pipedrive_metric_data IS 'Stores metadata about Pipedrive deals for metrics tracking';
COMMENT ON COLUMN pipedrive_metric_data.id IS 'Pipedrive deal ID (primary key)';
COMMENT ON COLUMN pipedrive_metric_data.title IS 'Deal title from Pipedrive';
COMMENT ON COLUMN pipedrive_metric_data.status IS 'Current deal status';
COMMENT ON COLUMN pipedrive_metric_data.first_fetched_at IS 'When this deal was first fetched';
COMMENT ON COLUMN pipedrive_metric_data.last_fetched_at IS 'When this deal was last fetched';
