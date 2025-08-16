CREATE TABLE IF NOT EXISTS kv_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_cache(updated_at DESC);

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
