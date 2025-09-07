-- Migration 019: Ensure pipedrive_submissions table has correct schema
-- This migration ensures the pipedrive_submissions table exists with the correct structure
-- for mock submissions functionality

-- Create pipedrive_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipedrive_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add request_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipedrive_submissions' AND column_name = 'request_id') THEN
    ALTER TABLE pipedrive_submissions ADD COLUMN request_id TEXT NOT NULL;
  END IF;
  
  -- Add payload column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipedrive_submissions' AND column_name = 'payload') THEN
    ALTER TABLE pipedrive_submissions ADD COLUMN payload JSONB NOT NULL;
  END IF;
  
  -- Add simulated_deal_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipedrive_submissions' AND column_name = 'simulated_deal_id') THEN
    ALTER TABLE pipedrive_submissions ADD COLUMN simulated_deal_id INTEGER NOT NULL;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipedrive_submissions' AND column_name = 'created_at') THEN
    ALTER TABLE pipedrive_submissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipedrive_submissions' AND column_name = 'updated_at') THEN
    ALTER TABLE pipedrive_submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_request_id ON pipedrive_submissions(request_id);
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_simulated_deal_id ON pipedrive_submissions(simulated_deal_id);
CREATE INDEX IF NOT EXISTS idx_pipedrive_submissions_created_at ON pipedrive_submissions(created_at DESC);

-- Add updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_pipedrive_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_pipedrive_submissions_updated_at ON pipedrive_submissions;
CREATE TRIGGER trigger_update_pipedrive_submissions_updated_at
  BEFORE UPDATE ON pipedrive_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_pipedrive_submissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE pipedrive_submissions IS 'Stores mock Pipedrive submissions for development and testing';
COMMENT ON COLUMN pipedrive_submissions.request_id IS 'The request ID from the requests table';
COMMENT ON COLUMN pipedrive_submissions.payload IS 'JSON payload containing contact and line items data';
COMMENT ON COLUMN pipedrive_submissions.simulated_deal_id IS 'Simulated Pipedrive deal ID for mock submissions';
COMMENT ON COLUMN pipedrive_submissions.created_at IS 'When the mock submission was created';
COMMENT ON COLUMN pipedrive_submissions.updated_at IS 'When the mock submission was last updated';
