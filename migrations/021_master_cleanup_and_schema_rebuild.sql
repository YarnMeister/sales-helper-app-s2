-- Master Migration: Cleanup and Schema Rebuild
-- This migration consolidates all schema changes and removes mock table references
-- Safe to run multiple times

-- Step 1: Drop all mock_ tables (safe to run multiple times)
DROP TABLE IF EXISTS mock_requests CASCADE;
DROP TABLE IF EXISTS mock_site_visits CASCADE;
DROP TABLE IF EXISTS mock_pipedrive_submissions CASCADE;

-- Step 2: Create custom types (safe to run multiple times)
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create schema_migrations table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 4: Create requests table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE,
    status request_status NOT NULL DEFAULT 'draft',
    salesperson_first_name TEXT,
    salesperson_selection TEXT,
    mine_group TEXT,
    mine_name TEXT,
    contact JSONB,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    comment TEXT,
    pipedrive_deal_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT requests_salesperson_selection_check 
        CHECK (salesperson_selection = ANY (ARRAY['Luyanda', 'James', 'Stefan']))
);

-- Step 5: Create site_visits table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    salesperson TEXT NOT NULL,
    planned_mines TEXT[] NOT NULL,
    main_purpose TEXT NOT NULL,
    availability TEXT NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_availability_valid 
        CHECK (availability = ANY (ARRAY['Later this morning', 'In the afternoon', 'Tomorrow'])),
    CONSTRAINT check_purpose_valid 
        CHECK (main_purpose = ANY (ARRAY['Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'])),
    CONSTRAINT check_salesperson_valid 
        CHECK (salesperson = ANY (ARRAY['James', 'Luyanda', 'Stefan']))
);

-- Step 6: Create pipedrive_submissions table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS pipedrive_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    simulated_deal_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 7: Create flow_metrics_config table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS flow_metrics_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_key TEXT UNIQUE NOT NULL,
    display_title TEXT NOT NULL,
    canonical_stage TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create canonical_stage_mappings table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS canonical_stage_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_stage TEXT NOT NULL,
    start_stage TEXT,
    end_stage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metric_config_id UUID,
    start_stage_id BIGINT,
    end_stage_id BIGINT,
    avg_min_days INTEGER,
    avg_max_days INTEGER,
    metric_comment TEXT
);

-- Step 9: Create pipedrive_deal_flow_data table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS pipedrive_deal_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id BIGINT NOT NULL,
    pipeline_id BIGINT NOT NULL,
    stage_id BIGINT NOT NULL,
    stage_name TEXT NOT NULL,
    entered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pipedrive_event_id BIGINT UNIQUE NOT NULL
);

-- Step 10: Create pipedrive_metric_data table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS pipedrive_metric_data (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    pipeline_id BIGINT NOT NULL,
    stage_id BIGINT NOT NULL,
    status TEXT NOT NULL,
    first_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 11: Create indexes (safe to run multiple times)
-- requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests (salesperson_selection);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);

-- site_visits indexes
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits (date);
CREATE INDEX IF NOT EXISTS idx_site_visits_salesperson ON site_visits (salesperson);

-- flow_metrics_config indexes
CREATE INDEX IF NOT EXISTS idx_fmc_is_active ON flow_metrics_config (is_active);
CREATE INDEX IF NOT EXISTS idx_fmc_metric_key ON flow_metrics_config (metric_key);
CREATE INDEX IF NOT EXISTS idx_fmc_sort_order ON flow_metrics_config (sort_order);

-- canonical_stage_mappings indexes
CREATE INDEX IF NOT EXISTS idx_csm_canonical_stage ON canonical_stage_mappings (canonical_stage);
CREATE INDEX IF NOT EXISTS idx_csm_start_stage ON canonical_stage_mappings (start_stage);
CREATE INDEX IF NOT EXISTS idx_csm_end_stage ON canonical_stage_mappings (end_stage);
CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings (start_stage_id);
CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings (end_stage_id);

-- pipedrive_deal_flow_data indexes
CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data (created_at);
CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data (deal_id);
CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data (entered_at);
CREATE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id ON pipedrive_deal_flow_data (pipedrive_event_id);
CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data (stage_id);

-- Step 12: Add column comments for business documentation
COMMENT ON COLUMN canonical_stage_mappings.canonical_stage IS 'The canonical stage name (e.g., Order Conversion)';
COMMENT ON COLUMN canonical_stage_mappings.start_stage IS 'The Pipedrive stage name that marks the start of this canonical stage';
COMMENT ON COLUMN canonical_stage_mappings.end_stage IS 'The Pipedrive stage name that marks the end of this canonical stage';
COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)';
COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)';
COMMENT ON COLUMN canonical_stage_mappings.avg_min_days IS 'Minimum threshold in days for green color coding (excellent performance)';
COMMENT ON COLUMN canonical_stage_mappings.avg_max_days IS 'Maximum threshold in days for red color coding (needs attention)';
COMMENT ON COLUMN canonical_stage_mappings.metric_comment IS 'Narrative or interpretation about the current metric performance';

COMMENT ON COLUMN pipedrive_deal_flow_data.deal_id IS 'Pipedrive deal ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.pipeline_id IS 'Pipedrive pipeline ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.stage_id IS 'Pipedrive stage ID';
COMMENT ON COLUMN pipedrive_deal_flow_data.stage_name IS 'Human-readable stage name';
COMMENT ON COLUMN pipedrive_deal_flow_data.entered_at IS 'When the deal entered this stage';
COMMENT ON COLUMN pipedrive_deal_flow_data.left_at IS 'When the deal left this stage (NULL if still in stage)';
COMMENT ON COLUMN pipedrive_deal_flow_data.duration_seconds IS 'Duration in seconds spent in this stage';
COMMENT ON COLUMN pipedrive_deal_flow_data.pipedrive_event_id IS 'Unique Pipedrive event ID to prevent duplicates';

-- Step 13: Record this migration
INSERT INTO schema_migrations (version, name) 
VALUES (21, 'master_cleanup_and_schema_rebuild')
ON CONFLICT (version) DO NOTHING;
