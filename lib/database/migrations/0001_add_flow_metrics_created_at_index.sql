-- Test migration: Add index to flow_metrics_config.created_at
-- This validates the full CI/CD migration workflow
-- Date: October 1, 2025

CREATE INDEX IF NOT EXISTS "idx_fmc_created_at" ON "flow_metrics_config" USING btree ("created_at");
