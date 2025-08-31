import { sql } from 'drizzle-orm';

// Index definitions for the database
export const indexes = [
  // Requests indexes
  sql`CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at DESC)`,
  sql`CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests (salesperson_selection)`,
  sql`CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status)`,
  
  // Site visits indexes
  sql`CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits (created_at)`,
  sql`CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits (date)`,
  sql`CREATE INDEX IF NOT EXISTS idx_site_visits_salesperson ON site_visits (salesperson)`,
  
  // Flow metrics config indexes
  sql`CREATE INDEX IF NOT EXISTS idx_fmc_is_active ON flow_metrics_config (is_active)`,
  sql`CREATE INDEX IF NOT EXISTS idx_fmc_metric_key ON flow_metrics_config (metric_key)`,
  sql`CREATE INDEX IF NOT EXISTS idx_fmc_sort_order ON flow_metrics_config (sort_order)`,
  
  // Canonical stage mappings indexes
  sql`CREATE INDEX IF NOT EXISTS idx_csm_canonical_stage ON canonical_stage_mappings (canonical_stage)`,
  sql`CREATE INDEX IF NOT EXISTS idx_csm_start_stage ON canonical_stage_mappings (start_stage)`,
  sql`CREATE INDEX IF NOT EXISTS idx_csm_end_stage ON canonical_stage_mappings (end_stage)`,
  sql`CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings (start_stage_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings (end_stage_id)`,
  
  // Pipedrive deal flow data indexes
  sql`CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data (created_at)`,
  sql`CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data (deal_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data (entered_at)`,
  sql`CREATE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id ON pipedrive_deal_flow_data (pipedrive_event_id)`,
  sql`CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data (stage_id)`,
];

// Column comments for business documentation
export const comments = [
  sql`COMMENT ON COLUMN canonical_stage_mappings.canonical_stage IS 'The canonical stage name (e.g., Order Conversion)'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.start_stage IS 'The Pipedrive stage name that marks the start of this canonical stage'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.end_stage IS 'The Pipedrive stage name that marks the end of this canonical stage'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.avg_min_days IS 'Minimum threshold in days for green color coding (excellent performance)'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.avg_max_days IS 'Maximum threshold in days for red color coding (needs attention)'`,
  sql`COMMENT ON COLUMN canonical_stage_mappings.metric_comment IS 'Narrative or interpretation about the current metric performance'`,
  
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.deal_id IS 'Pipedrive deal ID'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.pipeline_id IS 'Pipedrive pipeline ID'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.stage_id IS 'Pipedrive stage ID'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.stage_name IS 'Human-readable stage name'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.entered_at IS 'When the deal entered this stage'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.left_at IS 'When the deal left this stage (NULL if still in stage)'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.duration_seconds IS 'Duration in seconds spent in this stage'`,
  sql`COMMENT ON COLUMN pipedrive_deal_flow_data.pipedrive_event_id IS 'Unique Pipedrive event ID to prevent duplicates'`,
];
