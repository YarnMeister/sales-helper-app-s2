CREATE TABLE "deal_flow_sync_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text NOT NULL,
	"total_deals" integer,
	"processed_deals" integer,
	"successful_deals" integer,
	"failed_deals" jsonb,
	"errors" jsonb,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "canonical_stage_mappings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "flow_metrics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kv_cache" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mock_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "canonical_stage_mappings" CASCADE;--> statement-breakpoint
DROP TABLE "flow_metrics" CASCADE;--> statement-breakpoint
DROP TABLE "kv_cache" CASCADE;--> statement-breakpoint
DROP TABLE "mock_requests" CASCADE;--> statement-breakpoint
ALTER TABLE "site_visits" DROP CONSTRAINT "site_visits_request_id_requests_request_id_fk";
--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."request_status";--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."request_status";--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "status" SET DATA TYPE "public"."request_status" USING "status"::"public"."request_status";--> statement-breakpoint
DROP INDEX "idx_pipedrive_deal_flow_data_timestamp";--> statement-breakpoint
DROP INDEX "idx_pipedrive_metric_data_deal_id";--> statement-breakpoint
DROP INDEX "idx_pipedrive_metric_data_metric_key";--> statement-breakpoint
DROP INDEX "idx_pipedrive_metric_data_start_stage_id";--> statement-breakpoint
DROP INDEX "idx_pipedrive_metric_data_end_stage_id";--> statement-breakpoint
DROP INDEX "idx_requests_person_id";--> statement-breakpoint
DROP INDEX "idx_requests_org_id";--> statement-breakpoint
DROP INDEX "idx_site_visits_request_id";--> statement-breakpoint
DROP INDEX "idx_site_visits_visit_date";--> statement-breakpoint
DROP INDEX "idx_site_visits_mine_group";--> statement-breakpoint
DROP INDEX "idx_site_visits_mine_name";--> statement-breakpoint
DROP INDEX "idx_requests_mine_group";--> statement-breakpoint
DROP INDEX "idx_requests_mine_name";--> statement-breakpoint
DROP INDEX "idx_site_visits_salesperson";--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "simulated_deal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipedrive_submissions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "site_visits" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "flow_metrics_config" ADD COLUMN "config" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "pipeline_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "entered_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "left_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD COLUMN "pipedrive_event_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "pipeline_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "stage_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "first_fetched_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" ADD COLUMN "last_fetched_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "salesperson" text NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "planned_mines" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "main_purpose" text NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "availability" text NOT NULL;--> statement-breakpoint
ALTER TABLE "site_visits" ADD COLUMN "comments" text;--> statement-breakpoint
CREATE INDEX "idx_deal_flow_sync_status_sync_type" ON "deal_flow_sync_status" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "idx_deal_flow_sync_status_status" ON "deal_flow_sync_status" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deal_flow_sync_status_started_at" ON "deal_flow_sync_status" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_deal_flow_sync_status_completed_at" ON "deal_flow_sync_status" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_fmc_config_gin" ON "flow_metrics_config" USING btree ("config");--> statement-breakpoint
CREATE INDEX "idx_fmc_created_at" ON "flow_metrics_config" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_deal_flow_data_pipeline_id" ON "pipedrive_deal_flow_data" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_deal_flow_data_entered_at" ON "pipedrive_deal_flow_data" USING btree ("entered_at");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_pipeline_id" ON "pipedrive_metric_data" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_stage_id" ON "pipedrive_metric_data" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_status" ON "pipedrive_metric_data" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_site_visits_date" ON "site_visits" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_site_visits_created_at" ON "site_visits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_requests_mine_group" ON "requests" USING btree ("mine_group");--> statement-breakpoint
CREATE INDEX "idx_requests_mine_name" ON "requests" USING btree ("mine_name");--> statement-breakpoint
CREATE INDEX "idx_site_visits_salesperson" ON "site_visits" USING btree ("salesperson");--> statement-breakpoint
ALTER TABLE "flow_metrics_config" DROP COLUMN "canonical_stage";--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" DROP COLUMN "event_id";--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "deal_id";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "metric_key";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "start_stage_id";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "end_stage_id";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "start_timestamp";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "end_timestamp";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "duration_days";--> statement-breakpoint
ALTER TABLE "pipedrive_metric_data" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "contact_person_id_int";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "contact_org_id_int";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "contact_mine_group";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "contact_mine_name";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "request_id";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "visit_date";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "salesperson_first_name";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "salesperson_selection";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "mine_group";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "mine_name";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "contact";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "line_items";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "comment";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "submit_mode";--> statement-breakpoint
ALTER TABLE "site_visits" DROP COLUMN "pipedrive_deal_id";--> statement-breakpoint
ALTER TABLE "pipedrive_deal_flow_data" ADD CONSTRAINT "pipedrive_deal_flow_data_pipedrive_event_id_unique" UNIQUE("pipedrive_event_id");