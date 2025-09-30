import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const requestStatusEnum = pgEnum('request_status', ['draft', 'submitted', 'failed']);

// Base tables
export const flowMetricsConfig = pgTable('flow_metrics', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  metricKey: text('metric_key').notNull().unique(),
  displayTitle: text('display_title').notNull(),
  config: jsonb('config').notNull().default('{}'), // JSONB configuration (startStage, endStage, thresholds)
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  metricKeyIdx: index('idx_flow_metrics_config_metric_key').on(table.metricKey),
  sortOrderIdx: index('idx_flow_metrics_config_sort_order').on(table.sortOrder),
  isActiveIdx: index('idx_flow_metrics_config_is_active').on(table.isActive),
  configGinIdx: index('idx_flow_metrics_config_gin').on(table.config), // GIN index for JSONB queries
}));

// Removed: canonical_stage_mappings table (replaced with JSONB config in flow_metrics_config)

export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').unique(),
  status: requestStatusEnum('status').notNull().default('draft'),
  salespersonFirstName: text('salesperson_first_name'),
  salespersonSelection: text('salesperson_selection'),
  mineGroup: text('mine_group'),
  mineName: text('mine_name'),
  contact: jsonb('contact'),
  lineItems: jsonb('line_items').notNull().default('[]'),
  comment: text('comment'),
  pipedriveDealId: integer('pipedrive_deal_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  requestIdIdx: uniqueIndex('idx_requests_request_id').on(table.requestId),
  createdAtIdx: index('idx_requests_created_at').on(table.createdAt),
  statusIdx: index('idx_requests_status').on(table.status),
  mineGroupIdx: index('idx_requests_mine_group').on(table.mineGroup),
  mineNameIdx: index('idx_requests_mine_name').on(table.mineName),
  salespersonIdx: index('idx_requests_salesperson').on(table.salespersonSelection),
  lineItemsGinIdx: index('idx_requests_line_items_gin').on(table.lineItems),
  contactGinIdx: index('idx_requests_contact_gin').on(table.contact),
}));

export const mockRequests = pgTable('mock_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').unique(),
  status: requestStatusEnum('status').notNull().default('draft'),
  salespersonFirstName: text('salesperson_first_name'),
  salespersonSelection: text('salesperson_selection'),
  mineGroup: text('mine_group'),
  mineName: text('mine_name'),
  contact: jsonb('contact'),
  lineItems: jsonb('line_items').notNull().default('[]'),
  comment: text('comment'),
  pipedriveDealId: integer('pipedrive_deal_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  requestIdIdx: uniqueIndex('idx_mock_requests_request_id').on(table.requestId),
  createdAtIdx: index('idx_mock_requests_created_at').on(table.createdAt),
  statusIdx: index('idx_mock_requests_status').on(table.status),
}));

export const siteVisits = pgTable('site_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull().defaultNow(),
  salesperson: text('salesperson').notNull(),
  plannedMines: text('planned_mines').array().notNull(),
  mainPurpose: text('main_purpose').notNull(),
  availability: text('availability').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dateIdx: index('idx_site_visits_date').on(table.date),
  salespersonIdx: index('idx_site_visits_salesperson').on(table.salesperson),
  createdAtIdx: index('idx_site_visits_created_at').on(table.createdAt),
}));

export const pipedriveSubmissions = pgTable('pipedrive_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').notNull(),
  payload: jsonb('payload').notNull(),
  simulatedDealId: integer('simulated_deal_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  requestIdIdx: index('idx_pipedrive_submissions_request_id').on(table.requestId),
  simulatedDealIdIdx: index('idx_pipedrive_submissions_simulated_deal_id').on(table.simulatedDealId),
}));

export const pipedriveDealFlowData = pgTable('pipedrive_deal_flow_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: integer('deal_id').notNull(),
  stageId: integer('stage_id').notNull(),
  stageName: text('stage_name').notNull(),
  eventId: text('event_id'),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dealIdIdx: index('idx_pipedrive_deal_flow_data_deal_id').on(table.dealId),
  stageIdIdx: index('idx_pipedrive_deal_flow_data_stage_id').on(table.stageId),
  timestampIdx: index('idx_pipedrive_deal_flow_data_timestamp').on(table.timestamp),
}));

export const pipedriveMetricData = pgTable('pipedrive_metric_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: integer('deal_id').notNull(),
  metricKey: text('metric_key').notNull(),
  startStageId: integer('start_stage_id'),
  endStageId: integer('end_stage_id'),
  startTimestamp: timestamp('start_timestamp'),
  endTimestamp: timestamp('end_timestamp'),
  durationDays: integer('duration_days'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dealIdIdx: index('idx_pipedrive_metric_data_deal_id').on(table.dealId),
  metricKeyIdx: index('idx_pipedrive_metric_data_metric_key').on(table.metricKey),
  startStageIdIdx: index('idx_pipedrive_metric_data_start_stage_id').on(table.startStageId),
  endStageIdIdx: index('idx_pipedrive_metric_data_end_stage_id').on(table.endStageId),
}));

export const flowMetrics = pgTable('flow_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricKey: text('metric_key').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  avgDurationDays: integer('avg_duration_days'),
  totalDeals: integer('total_deals').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  metricKeyIdx: index('idx_flow_metrics_metric_key').on(table.metricKey),
  startDateIdx: index('idx_flow_metrics_start_date').on(table.startDate),
  endDateIdx: index('idx_flow_metrics_end_date').on(table.endDate),
}));

export const kvCache = pgTable('kv_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('idx_kv_cache_key').on(table.key),
  expiresAtIdx: index('idx_kv_cache_expires_at').on(table.expiresAt),
}));

export const schemaMigrations = pgTable('schema_migrations', {
  version: integer('version').primaryKey(),
  name: text('name').notNull(),
  executedAt: timestamp('executed_at').notNull().defaultNow(),
});

// Relations
// Removed: flowMetricsConfig and canonicalStageMappings relations (canonical_stage_mappings table dropped)

export const requestsRelations = relations(requests, ({ many }) => ({
  pipedriveSubmissions: many(pipedriveSubmissions),
}));

// Site visits are now independent check-ins, not related to requests
// export const siteVisitsRelations = relations(siteVisits, ({ one }) => ({
//   request: one(requests, {
//     fields: [siteVisits.requestId],
//     references: [requests.requestId],
//   }),
// }));

export const pipedriveSubmissionsRelations = relations(pipedriveSubmissions, ({ one }) => ({
  request: one(requests, {
    fields: [pipedriveSubmissions.requestId],
    references: [requests.requestId],
  }),
}));

// Export types
export type FlowMetricsConfig = typeof flowMetricsConfig.$inferSelect;
export type NewFlowMetricsConfig = typeof flowMetricsConfig.$inferInsert;
// Removed: CanonicalStageMapping types (table dropped)
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type MockRequest = typeof mockRequests.$inferSelect;
export type NewMockRequest = typeof mockRequests.$inferInsert;
export type SiteVisit = typeof siteVisits.$inferSelect;
export type NewSiteVisit = typeof siteVisits.$inferInsert;
export type PipedriveSubmission = typeof pipedriveSubmissions.$inferSelect;
export type NewPipedriveSubmission = typeof pipedriveSubmissions.$inferInsert;
export type PipedriveDealFlowData = typeof pipedriveDealFlowData.$inferSelect;
export type NewPipedriveDealFlowData = typeof pipedriveDealFlowData.$inferInsert;
export type PipedriveMetricData = typeof pipedriveMetricData.$inferSelect;
export type NewPipedriveMetricData = typeof pipedriveMetricData.$inferInsert;
export type FlowMetric = typeof flowMetrics.$inferSelect;
export type NewFlowMetric = typeof flowMetrics.$inferInsert;
export type KvCache = typeof kvCache.$inferSelect;
export type NewKvCache = typeof kvCache.$inferInsert;
export type SchemaMigration = typeof schemaMigrations.$inferSelect;
export type NewSchemaMigration = typeof schemaMigrations.$inferInsert;
