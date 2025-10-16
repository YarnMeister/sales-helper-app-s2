-- Fix flow_metrics_config ID column from INTEGER to UUID
-- Root cause: Table was manually created with INTEGER ID instead of using Drizzle migration
-- This migration converts existing data to UUID format

-- Step 1: Create backup of existing data
CREATE TEMP TABLE flow_metrics_config_backup AS 
SELECT metric_key, display_title, config, sort_order, is_active, created_at, updated_at 
FROM flow_metrics_config;

-- Step 2: Drop the existing table (only 4 rows, safe to recreate)
DROP TABLE flow_metrics_config;

-- Step 3: Recreate table with correct UUID structure (from 0000_mighty_reaper.sql)
CREATE TABLE "flow_metrics_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"display_title" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flow_metrics_config_metric_key_unique" UNIQUE("metric_key")
);
--> statement-breakpoint

-- Step 4: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_fmc_metric_key" ON "flow_metrics_config" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fmc_sort_order" ON "flow_metrics_config" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fmc_is_active" ON "flow_metrics_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fmc_config_gin" ON "flow_metrics_config" USING gin ("config");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fmc_created_at" ON "flow_metrics_config" USING btree ("created_at");--> statement-breakpoint

-- Step 5: Restore data with new UUIDs
INSERT INTO flow_metrics_config (metric_key, display_title, config, sort_order, is_active, created_at, updated_at)
SELECT metric_key, display_title, config, sort_order, is_active, created_at, updated_at
FROM flow_metrics_config_backup
ORDER BY sort_order;

