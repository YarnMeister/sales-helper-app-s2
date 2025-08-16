-- Migration 3: Database Functions for Enhanced Client Utilities
-- This migration adds the RPC functions needed for the database client utilities

-- Drop existing functions if they exist to avoid conflicts (with CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS generate_request_id() CASCADE;
DROP FUNCTION IF EXISTS validate_contact_jsonb(JSONB) CASCADE;

-- Function to generate sequential request IDs
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM requests
    WHERE request_id ~ '^QR-[0-9]+$';
    
    RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to validate contact JSONB data
CREATE OR REPLACE FUNCTION validate_contact_jsonb(contact_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN contact_data ? 'personId' 
       AND contact_data ? 'name'
       AND contact_data ? 'mineGroup'
       AND contact_data ? 'mineName';
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_request_id() IS 'Generates sequential request IDs in format QR-001, QR-002, etc.';
COMMENT ON FUNCTION validate_contact_jsonb(JSONB) IS 'Validates contact JSONB data has required fields: personId, name, mineGroup, mineName';
