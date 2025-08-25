-- Migration 014: Fix pipedrive_event_id column and clean up existing data
-- This migration ensures the unique constraint works properly

-- Clean up existing records that don't have pipedrive_event_id
DELETE FROM pipedrive_deal_flow_data WHERE pipedrive_event_id IS NULL;

-- Drop the existing index if it exists
DROP INDEX IF EXISTS idx_pdfd_pipedrive_event_id_unique;

-- Create unique index on pipedrive_event_id (only after cleaning up)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id_unique 
ON pipedrive_deal_flow_data(pipedrive_event_id);

-- Add NOT NULL constraint to pipedrive_event_id column
ALTER TABLE pipedrive_deal_flow_data 
ALTER COLUMN pipedrive_event_id SET NOT NULL;
