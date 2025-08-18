-- Migration 007: Create mock tables for local testing
-- This separates local development data from production data

-- Create mock_requests table (identical to requests table)
CREATE TABLE IF NOT EXISTS mock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'failed')),
  salesperson_first_name VARCHAR(100),
  salesperson_selection VARCHAR(20) CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')),
  mine_group VARCHAR(200),
  mine_name VARCHAR(200),
  contact JSONB,
  line_items JSONB DEFAULT '[]'::jsonb,
  comment TEXT,
  pipedrive_deal_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mock_requests (same as requests table)
CREATE INDEX IF NOT EXISTS idx_mock_requests_status ON mock_requests(status);
CREATE INDEX IF NOT EXISTS idx_mock_requests_salesperson ON mock_requests(salesperson_first_name);
CREATE INDEX IF NOT EXISTS idx_mock_requests_created_at ON mock_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_mock_requests_request_id ON mock_requests(request_id);

-- Create mock_site_visits table (identical to site_visits table)
CREATE TABLE IF NOT EXISTS mock_site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  salesperson VARCHAR(100) NOT NULL,
  planned_mines TEXT[] NOT NULL,
  main_purpose VARCHAR(100) NOT NULL,
  availability VARCHAR(50) NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mock_site_visits (same as site_visits table)
CREATE INDEX IF NOT EXISTS idx_mock_site_visits_date ON mock_site_visits(date);
CREATE INDEX IF NOT EXISTS idx_mock_site_visits_salesperson ON mock_site_visits(salesperson);
CREATE INDEX IF NOT EXISTS idx_mock_site_visits_created_at ON mock_site_visits(created_at);

-- Add comments for documentation
COMMENT ON TABLE mock_requests IS 'Mock requests table for local development testing - mirrors requests table structure';
COMMENT ON TABLE mock_site_visits IS 'Mock site visits table for local development testing - mirrors site_visits table structure';
COMMENT ON COLUMN mock_requests.request_id IS 'Unique request identifier (QR-XXX format)';
COMMENT ON COLUMN mock_requests.status IS 'Request status: draft, submitted, or failed';
COMMENT ON COLUMN mock_requests.contact IS 'JSONB contact information';
COMMENT ON COLUMN mock_requests.line_items IS 'JSONB array of line items';
COMMENT ON COLUMN mock_site_visits.date IS 'Date of the site visit (defaults to today)';
COMMENT ON COLUMN mock_site_visits.salesperson IS 'Name of the salesperson making the visit';
COMMENT ON COLUMN mock_site_visits.planned_mines IS 'Array of mine names to be visited';
COMMENT ON COLUMN mock_site_visits.main_purpose IS 'Primary purpose of the visit';
COMMENT ON COLUMN mock_site_visits.availability IS 'When the salesperson will be back in office';
COMMENT ON COLUMN mock_site_visits.comments IS 'Optional additional comments about the visit';
