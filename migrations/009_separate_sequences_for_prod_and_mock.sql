-- Migration 9: Separate Sequences for Prod and Mock Tables
-- This migration creates separate sequences and functions for production and mock tables
-- to prevent ID conflicts between environments

-- Create separate sequences for prod and mock
CREATE SEQUENCE IF NOT EXISTS prod_request_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS mock_request_id_seq START 1;

-- Drop existing function
DROP FUNCTION IF EXISTS generate_request_id() CASCADE;

-- Create separate functions for each environment
CREATE OR REPLACE FUNCTION generate_prod_request_id()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('prod_request_id_seq') INTO next_num;
    RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_mock_request_id()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('mock_request_id_seq') INTO next_num;
    RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Keep the original function name for backward compatibility
-- This will be the default function that applications can call
-- The application layer should decide which specific function to use
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
BEGIN
    -- Default to prod sequence for safety
    RETURN generate_prod_request_id();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON SEQUENCE prod_request_id_seq IS 'Sequence for production request IDs';
COMMENT ON SEQUENCE mock_request_id_seq IS 'Sequence for mock/development request IDs';
COMMENT ON FUNCTION generate_prod_request_id() IS 'Generates sequential request IDs using production sequence';
COMMENT ON FUNCTION generate_mock_request_id() IS 'Generates sequential request IDs using mock/development sequence';
COMMENT ON FUNCTION generate_request_id() IS 'Default function that generates production request IDs. Use generate_prod_request_id() or generate_mock_request_id() for environment-specific IDs';
