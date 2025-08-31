-- Test tables with same structure as production but prefixed
CREATE TABLE IF NOT EXISTS test_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_progress', 'won', 'lost')),
    salesperson_first_name TEXT,
    mine_group TEXT,
    mine_name TEXT,
    contact JSONB,
    line_items JSONB DEFAULT '[]'::jsonb,
    comment TEXT,
    pipedrive_deal_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_kv_cache (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS test_pipedrive_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    simulated_deal_id INTEGER NOT NULL,
    submission_data JSONB NOT NULL,
    status TEXT DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for test tables
CREATE INDEX IF NOT EXISTS idx_test_requests_status ON test_requests(status);
CREATE INDEX IF NOT EXISTS idx_test_requests_salesperson ON test_requests(salesperson_first_name);
CREATE INDEX IF NOT EXISTS idx_test_requests_created_at ON test_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_test_kv_cache_expires_at ON test_kv_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_test_pipedrive_submissions_request_id ON test_pipedrive_submissions(request_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_test_requests_updated_at ON test_requests;
CREATE TRIGGER update_test_requests_updated_at 
    BEFORE UPDATE ON test_requests 
    FOR EACH ROW EXECUTE FUNCTION update_test_updated_at_column();

DROP TRIGGER IF EXISTS update_test_kv_cache_updated_at ON test_kv_cache;
CREATE TRIGGER update_test_kv_cache_updated_at 
    BEFORE UPDATE ON test_kv_cache 
    FOR EACH ROW EXECUTE FUNCTION update_test_updated_at_column();
