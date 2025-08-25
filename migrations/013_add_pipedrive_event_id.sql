-- Migration 013: Add pipedrive_event_id column to prevent duplicate insertions
-- This migration adds a unique constraint on Pipedrive event IDs to ensure no duplicates

-- Add the pipedrive_event_id column
ALTER TABLE pipedrive_deal_flow_data 
ADD COLUMN IF NOT EXISTS pipedrive_event_id BIGINT;

-- Clean up existing records that don't have pipedrive_event_id
DELETE FROM pipedrive_deal_flow_data WHERE pipedrive_event_id IS NULL;

-- Create unique index on pipedrive_event_id (only after cleaning up)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id_unique 
ON pipedrive_deal_flow_data(pipedrive_event_id);

-- Add comment for documentation
COMMENT ON COLUMN pipedrive_deal_flow_data.pipedrive_event_id IS 'Unique Pipedrive event ID to prevent duplicates';

-- Note: Existing records will have NULL pipedrive_event_id values
-- These will be updated when the data is re-fetched from Pipedrive
