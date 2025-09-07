CREATE TYPE "public"."request_status" AS ENUM('draft', 'submitted', 'failed');--> statement-breakpoint
CREATE TABLE "canonical_stage_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_config_id" uuid,
	"canonical_stage" text NOT NULL,
	"start_stage" text,
	"end_stage" text,
	"start_stage_id" integer,
	"end_stage_id" integer,
	"avg_min_days" integer,
	"avg_max_days" integer,
	"metric_comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flow_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"avg_duration_days" integer,
	"total_deals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flow_metrics_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"display_title" text NOT NULL,
	"canonical_stage" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "flow_metrics_config_metric_key_unique" UNIQUE("metric_key")
);
--> statement-breakpoint
CREATE TABLE "kv_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "kv_cache_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "mock_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text,
	"status" "request_status" DEFAULT 'draft' NOT NULL,
	"salesperson_first_name" text,
	"salesperson_selection" text,
	"mine_group" text,
	"mine_name" text,
	"contact" jsonb,
	"line_items" jsonb DEFAULT '[]' NOT NULL,
	"comment" text,
	"pipedrive_deal_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mock_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "pipedrive_deal_flow_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" integer NOT NULL,
	"stage_id" integer NOT NULL,
	"stage_name" text NOT NULL,
	"event_id" text,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipedrive_metric_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" integer NOT NULL,
	"metric_key" text NOT NULL,
	"start_stage_id" integer,
	"end_stage_id" integer,
	"start_timestamp" timestamp,
	"end_timestamp" timestamp,
	"duration_days" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipedrive_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"simulated_deal_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text,
	"status" "request_status" DEFAULT 'draft' NOT NULL,
	"salesperson_first_name" text,
	"salesperson_selection" text,
	"mine_group" text,
	"mine_name" text,
	"contact" jsonb,
	"line_items" jsonb DEFAULT '[]' NOT NULL,
	"comment" text,
	"pipedrive_deal_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"contact_person_id_int" integer,
	"contact_org_id_int" integer,
	"contact_mine_group" text,
	"contact_mine_name" text,
	CONSTRAINT "requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text,
	"visit_date" timestamp NOT NULL,
	"salesperson_first_name" text,
	"salesperson_selection" text,
	"mine_group" text,
	"mine_name" text,
	"contact" jsonb,
	"line_items" jsonb DEFAULT '[]' NOT NULL,
	"comment" text,
	"submit_mode" text DEFAULT 'mock',
	"pipedrive_deal_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canonical_stage_mappings" ADD CONSTRAINT "canonical_stage_mappings_metric_config_id_flow_metrics_config_id_fk" FOREIGN KEY ("metric_config_id") REFERENCES "public"."flow_metrics_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_request_id_requests_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("request_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_csm_canonical_stage" ON "canonical_stage_mappings" USING btree ("canonical_stage");--> statement-breakpoint
CREATE INDEX "idx_csm_start_stage" ON "canonical_stage_mappings" USING btree ("start_stage");--> statement-breakpoint
CREATE INDEX "idx_csm_end_stage" ON "canonical_stage_mappings" USING btree ("end_stage");--> statement-breakpoint
CREATE INDEX "idx_csm_start_stage_id" ON "canonical_stage_mappings" USING btree ("start_stage_id");--> statement-breakpoint
CREATE INDEX "idx_csm_end_stage_id" ON "canonical_stage_mappings" USING btree ("end_stage_id");--> statement-breakpoint
CREATE INDEX "idx_csm_metric_config_id" ON "canonical_stage_mappings" USING btree ("metric_config_id");--> statement-breakpoint
CREATE INDEX "idx_flow_metrics_metric_key" ON "flow_metrics" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "idx_flow_metrics_start_date" ON "flow_metrics" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_flow_metrics_end_date" ON "flow_metrics" USING btree ("end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fmc_metric_key" ON "flow_metrics_config" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "idx_fmc_sort_order" ON "flow_metrics_config" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_fmc_is_active" ON "flow_metrics_config" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_kv_cache_key" ON "kv_cache" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_kv_cache_expires_at" ON "kv_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mock_requests_request_id" ON "mock_requests" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_mock_requests_created_at" ON "mock_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mock_requests_status" ON "mock_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_deal_flow_data_deal_id" ON "pipedrive_deal_flow_data" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_deal_flow_data_stage_id" ON "pipedrive_deal_flow_data" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_deal_flow_data_timestamp" ON "pipedrive_deal_flow_data" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_deal_id" ON "pipedrive_metric_data" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_metric_key" ON "pipedrive_metric_data" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_start_stage_id" ON "pipedrive_metric_data" USING btree ("start_stage_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_metric_data_end_stage_id" ON "pipedrive_metric_data" USING btree ("end_stage_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_submissions_request_id" ON "pipedrive_submissions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_pipedrive_submissions_simulated_deal_id" ON "pipedrive_submissions" USING btree ("simulated_deal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_requests_request_id" ON "requests" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_requests_created_at" ON "requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_requests_status" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_requests_mine_group" ON "requests" USING btree ("contact_mine_group");--> statement-breakpoint
CREATE INDEX "idx_requests_mine_name" ON "requests" USING btree ("contact_mine_name");--> statement-breakpoint
CREATE INDEX "idx_requests_person_id" ON "requests" USING btree ("contact_person_id_int");--> statement-breakpoint
CREATE INDEX "idx_requests_org_id" ON "requests" USING btree ("contact_org_id_int");--> statement-breakpoint
CREATE INDEX "idx_requests_salesperson" ON "requests" USING btree ("salesperson_selection");--> statement-breakpoint
CREATE INDEX "idx_requests_line_items_gin" ON "requests" USING btree ("line_items");--> statement-breakpoint
CREATE INDEX "idx_requests_contact_gin" ON "requests" USING btree ("contact");--> statement-breakpoint
CREATE INDEX "idx_site_visits_request_id" ON "site_visits" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_site_visits_visit_date" ON "site_visits" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "idx_site_visits_salesperson" ON "site_visits" USING btree ("salesperson_selection");--> statement-breakpoint
CREATE INDEX "idx_site_visits_mine_group" ON "site_visits" USING btree ("mine_group");--> statement-breakpoint
CREATE INDEX "idx_site_visits_mine_name" ON "site_visits" USING btree ("mine_name");