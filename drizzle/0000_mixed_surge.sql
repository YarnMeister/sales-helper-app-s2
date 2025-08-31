CREATE TYPE "public"."request_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "canonical_stage_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_stage" text NOT NULL,
	"start_stage" text,
	"end_stage" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metric_config_id" uuid,
	"start_stage_id" bigint,
	"end_stage_id" bigint,
	"avg_min_days" integer,
	"avg_max_days" integer,
	"metric_comment" text
);
--> statement-breakpoint
CREATE TABLE "flow_metrics_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"display_title" text NOT NULL,
	"canonical_stage" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "flow_metrics_config_metric_key_unique" UNIQUE("metric_key")
);
--> statement-breakpoint
CREATE TABLE "pipedrive_deal_flow_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" bigint NOT NULL,
	"pipeline_id" bigint NOT NULL,
	"stage_id" bigint NOT NULL,
	"stage_name" text NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	"duration_seconds" bigint,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"pipedrive_event_id" bigint NOT NULL,
	CONSTRAINT "pipedrive_deal_flow_data_pipedrive_event_id_unique" UNIQUE("pipedrive_event_id")
);
--> statement-breakpoint
CREATE TABLE "pipedrive_metric_data" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"pipeline_id" bigint NOT NULL,
	"stage_id" bigint NOT NULL,
	"status" text NOT NULL,
	"first_fetched_at" timestamp with time zone DEFAULT now(),
	"last_fetched_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipedrive_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"simulated_deal_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"salesperson" text NOT NULL,
	"planned_mines" text[] NOT NULL,
	"main_purpose" text NOT NULL,
	"availability" text NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "canonical_stage_mappings" ADD CONSTRAINT "canonical_stage_mappings_metric_config_id_flow_metrics_config_id_fk" FOREIGN KEY ("metric_config_id") REFERENCES "public"."flow_metrics_config"("id") ON DELETE no action ON UPDATE no action;