-- Migration 002: Support Tables
-- Mock submissions for testing (KV cache now handled by Redis)

-- Mock submissions for testing
CREATE TABLE IF NOT EXISTS mock_pipedrive_submissions (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mock_req ON mock_pipedrive_submissions(request_id);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert migration records
INSERT INTO schema_migrations (version, name) VALUES 
  (1, 'initial_schema'),
  (2, 'support_tables')
ON CONFLICT (version) DO NOTHING;
