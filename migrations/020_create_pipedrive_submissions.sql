-- Migration 020: Create pipedrive_submissions table (Development/Test only)
-- This creates the pipedrive_submissions table for tracking submissions in dev/test environments
-- Production should not have this table as it uses real Pipedrive API

-- Only create this table in development/test environments
DO $$
BEGIN
  IF current_setting('app.environment', true) IN ('development', 'test') OR current_setting('app.environment', true) IS NULL THEN
    -- Create pipedrive_submissions table
    CREATE TABLE IF NOT EXISTS pipedrive_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_request_id ON pipedrive_submissions(request_id);
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_created_at ON pipedrive_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_simulated_deal_id ON pipedrive_submissions(simulated_deal_id);

-- Add updated_at trigger
CREATE TRIGGER trg_pipedrive_submissions_updated 
    BEFORE UPDATE ON pipedrive_submissions
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

    -- Add comments
    COMMENT ON TABLE pipedrive_submissions IS 'Development/Test table for tracking Pipedrive submissions (replaces mock_pipedrive_submissions)';
    COMMENT ON COLUMN pipedrive_submissions.request_id IS 'Reference to the request that was submitted';
    COMMENT ON COLUMN pipedrive_submissions.payload IS 'JSON payload of the submission data';
    COMMENT ON COLUMN pipedrive_submissions.simulated_deal_id IS 'Simulated deal ID for mock submissions';
  END IF;
END $$;
