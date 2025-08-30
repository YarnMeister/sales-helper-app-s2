-- Migration 019: Drop mock tables since we now have true database separation
-- This migration removes the mock_* tables since we're using separate databases for dev/test vs production

-- Drop mock tables (they're no longer needed with separate databases)
DROP TABLE IF EXISTS mock_requests CASCADE;
DROP TABLE IF EXISTS mock_site_visits CASCADE;
DROP TABLE IF EXISTS mock_pipedrive_submissions CASCADE;

-- Drop mock-specific sequences
DROP SEQUENCE IF EXISTS mock_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS mock_site_visits_id_seq CASCADE;
DROP SEQUENCE IF EXISTS mock_pipedrive_submissions_id_seq CASCADE;

-- Drop mock-specific functions
DROP FUNCTION IF EXISTS generate_mock_request_id() CASCADE;
DROP FUNCTION IF EXISTS generate_mock_site_visit_id() CASCADE;
DROP FUNCTION IF EXISTS generate_mock_pipedrive_submission_id() CASCADE;

-- Note: The regular tables (requests, site_visits, etc.) and their functions remain
-- These will be used for both development (test database) and production (production database)
