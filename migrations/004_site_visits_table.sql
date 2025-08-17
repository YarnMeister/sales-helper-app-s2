-- Migration 004: Add site_visits table for check-in functionality
-- This table stores site visit data for Slack notifications

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  salesperson TEXT NOT NULL,
  planned_mines TEXT[] NOT NULL,
  main_purpose TEXT NOT NULL,
  availability TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(date);
CREATE INDEX IF NOT EXISTS idx_site_visits_salesperson ON site_visits(salesperson);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_site_visits_updated_at();

-- Add validation constraints
ALTER TABLE site_visits 
ADD CONSTRAINT check_salesperson_valid 
CHECK (salesperson IN ('James', 'Luyanda', 'Stefan'));

ALTER TABLE site_visits 
ADD CONSTRAINT check_purpose_valid 
CHECK (main_purpose IN ('Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'));

ALTER TABLE site_visits 
ADD CONSTRAINT check_availability_valid 
CHECK (availability IN ('Later this morning', 'In the afternoon', 'Tomorrow'));

-- Add comments
COMMENT ON TABLE site_visits IS 'Stores site visit check-in data for Slack notifications';
COMMENT ON COLUMN site_visits.date IS 'Date of the site visit (defaults to today)';
COMMENT ON COLUMN site_visits.salesperson IS 'Name of the salesperson making the visit';
COMMENT ON COLUMN site_visits.planned_mines IS 'Array of mine names to be visited';
COMMENT ON COLUMN site_visits.main_purpose IS 'Primary purpose of the visit';
COMMENT ON COLUMN site_visits.availability IS 'When the salesperson will be back in office';
COMMENT ON COLUMN site_visits.comments IS 'Optional additional comments about the visit';
