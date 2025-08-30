import { BaseFactory } from './base-factory';

// Type definitions for Flow Metrics data structures
export interface TFlowMetricConfig {
  id: string;
  metric_key: string;
  display_title: string;
  canonical_stage: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TCanonicalStageMapping {
  id: string;
  metric_config_id: string;
  canonical_stage: string;
  start_stage?: string;
  end_stage?: string;
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface TPipedriveDealFlowData {
  id: string;
  pipedrive_event_id: number;
  deal_id: number;
  pipeline_id: number;
  stage_id: number;
  stage_name: string;
  entered_at: string;
  left_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface TFlowMetricWithMapping extends TFlowMetricConfig {
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
}

export interface TCanonicalStageDeal {
  deal_id: string;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

// Predefined metric configurations for common scenarios
export const PREDEFINED_METRICS = {
  LEAD_CONVERSION: {
    metric_key: 'lead-conversion',
    display_title: 'Lead Conversion Time',
    canonical_stage: 'Lead Conversion',
    sort_order: 1,
    start_stage_id: 1,
    end_stage_id: 3,
    avg_min_days: 2,
    avg_max_days: 7
  },
  QUOTE_CONVERSION: {
    metric_key: 'quote-conversion',
    display_title: 'Quote Conversion Time',
    canonical_stage: 'Quote Conversion',
    sort_order: 2,
    start_stage_id: 3,
    end_stage_id: 5,
    avg_min_days: 3,
    avg_max_days: 10
  },
  ORDER_CONVERSION: {
    metric_key: 'order-conversion',
    display_title: 'Order Conversion Time',
    canonical_stage: 'Order Conversion',
    sort_order: 3,
    start_stage_id: 5,
    end_stage_id: 7,
    avg_min_days: 1,
    avg_max_days: 5
  },
  MANUFACTURING: {
    metric_key: 'manufacturing',
    display_title: 'Manufacturing Lead Time',
    canonical_stage: 'Manufacturing',
    sort_order: 4,
    start_stage_id: 7,
    end_stage_id: 9,
    avg_min_days: 5,
    avg_max_days: 15
  },
  DELIVERY: {
    metric_key: 'delivery',
    display_title: 'Delivery Lead Time',
    canonical_stage: 'Delivery',
    sort_order: 5,
    start_stage_id: 9,
    end_stage_id: 11,
    avg_min_days: 2,
    avg_max_days: 8
  }
};

// Predefined stage names for realistic testing
export const STAGE_NAMES = [
  'Lead Generated',
  'Initial Contact',
  'RFQ Received',
  'RFQ Sent',
  'Quote Generated',
  'Quote Sent - Repair',
  'Order Received - Johan',
  'In Progress- Johan',
  'Quality Control',
  'Order Ready - Johan',
  'Delivery Scheduled',
  'Units Collected',
  'Order Inv Paid'
];

export class FlowMetricConfigFactory extends BaseFactory<TFlowMetricConfig> {
  build(overrides?: Partial<TFlowMetricConfig>): TFlowMetricConfig {
    const now = new Date().toISOString();
    
    return {
      id: this.nextString('metric'),
      metric_key: overrides?.metric_key || `metric-${this.nextId()}`,
      display_title: overrides?.display_title || `Test Metric ${this.nextId()}`,
      canonical_stage: overrides?.canonical_stage || `Stage ${this.nextId()}`,
      sort_order: overrides?.sort_order ?? this.nextId(),
      is_active: overrides?.is_active ?? true,
      created_at: overrides?.created_at || now,
      updated_at: overrides?.updated_at || now,
      ...overrides
    };
  }

  // Convenience methods for common scenarios
  buildLeadConversion(overrides?: Partial<TFlowMetricConfig>): TFlowMetricConfig {
    return this.build({
      ...PREDEFINED_METRICS.LEAD_CONVERSION,
      id: this.nextString('metric'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    });
  }

  buildManufacturing(overrides?: Partial<TFlowMetricConfig>): TFlowMetricConfig {
    return this.build({
      ...PREDEFINED_METRICS.MANUFACTURING,
      id: this.nextString('metric'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    });
  }

  buildInactive(overrides?: Partial<TFlowMetricConfig>): TFlowMetricConfig {
    return this.build({
      is_active: false,
      ...overrides
    });
  }
}

export class CanonicalStageMappingFactory extends BaseFactory<TCanonicalStageMapping> {
  build(overrides?: Partial<TCanonicalStageMapping>): TCanonicalStageMapping {
    const now = new Date().toISOString();
    
    return {
      id: this.nextString('mapping'),
      metric_config_id: overrides?.metric_config_id || this.nextString('metric'),
      canonical_stage: overrides?.canonical_stage || `Stage ${this.nextId()}`,
      start_stage: overrides?.start_stage || this.randomFromArray(STAGE_NAMES),
      end_stage: overrides?.end_stage || this.randomFromArray(STAGE_NAMES),
      start_stage_id: overrides?.start_stage_id ?? this.nextId(),
      end_stage_id: overrides?.end_stage_id ?? this.nextId() + 2,
      avg_min_days: overrides?.avg_min_days ?? Math.floor(Math.random() * 5) + 1,
      avg_max_days: overrides?.avg_max_days ?? Math.floor(Math.random() * 10) + 5,
      metric_comment: overrides?.metric_comment || `Test comment for ${this.nextId()}`,
      created_at: overrides?.created_at || now,
      updated_at: overrides?.updated_at || now,
      ...overrides
    };
  }

  // Convenience methods for common scenarios
  buildForMetric(metricConfig: TFlowMetricConfig, overrides?: Partial<TCanonicalStageMapping>): TCanonicalStageMapping {
    return this.build({
      metric_config_id: metricConfig.id,
      canonical_stage: metricConfig.canonical_stage,
      ...overrides
    });
  }

  buildWithThresholds(minDays: number, maxDays: number, overrides?: Partial<TCanonicalStageMapping>): TCanonicalStageMapping {
    return this.build({
      avg_min_days: minDays,
      avg_max_days: maxDays,
      ...overrides
    });
  }
}

export class PipedriveDealFlowDataFactory extends BaseFactory<TPipedriveDealFlowData> {
  build(overrides?: Partial<TPipedriveDealFlowData>): TPipedriveDealFlowData {
    const now = new Date().toISOString();
    const enteredAt = overrides?.entered_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const leftAt = overrides?.left_at || new Date(new Date(enteredAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const durationSeconds = overrides?.duration_seconds ?? Math.floor((new Date(leftAt).getTime() - new Date(enteredAt).getTime()) / 1000);
    
    return {
      id: this.nextString('flow'),
      pipedrive_event_id: overrides?.pipedrive_event_id ?? this.nextId(),
      deal_id: overrides?.deal_id ?? this.nextId(),
      pipeline_id: overrides?.pipeline_id ?? 1,
      stage_id: overrides?.stage_id ?? this.nextId(),
      stage_name: overrides?.stage_name || this.randomFromArray(STAGE_NAMES),
      entered_at: enteredAt,
      left_at: leftAt,
      duration_seconds: durationSeconds,
      created_at: overrides?.created_at || now,
      updated_at: overrides?.updated_at || now,
      ...overrides
    };
  }

  // Convenience methods for common scenarios
  buildForDeal(dealId: number, overrides?: Partial<TPipedriveDealFlowData>): TPipedriveDealFlowData {
    return this.build({
      deal_id: dealId,
      ...overrides
    });
  }

  buildForStage(stageId: number, stageName: string, overrides?: Partial<TPipedriveDealFlowData>): TPipedriveDealFlowData {
    return this.build({
      stage_id: stageId,
      stage_name: stageName,
      ...overrides
    });
  }

  buildWithDuration(durationDays: number, overrides?: Partial<TPipedriveDealFlowData>): TPipedriveDealFlowData {
    const enteredAt = overrides?.entered_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const leftAt = new Date(new Date(enteredAt).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const durationSeconds = durationDays * 24 * 60 * 60;
    
    return this.build({
      entered_at: enteredAt,
      left_at: leftAt,
      duration_seconds: durationSeconds,
      ...overrides
    });
  }

  buildIncomplete(overrides?: Partial<TPipedriveDealFlowData>): TPipedriveDealFlowData {
    return this.build({
      left_at: undefined,
      duration_seconds: undefined,
      ...overrides
    });
  }
}

export class CanonicalStageDealFactory extends BaseFactory<TCanonicalStageDeal> {
  build(overrides?: Partial<TCanonicalStageDeal>): TCanonicalStageDeal {
    const startDate = overrides?.start_date || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = overrides?.end_date || new Date(new Date(startDate).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const durationSeconds = overrides?.duration_seconds ?? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 1000);
    
    return {
      deal_id: overrides?.deal_id || this.nextString('deal'),
      start_date: startDate,
      end_date: endDate,
      duration_seconds: durationSeconds,
      ...overrides
    };
  }

  // Convenience methods for common scenarios
  buildWithDuration(durationDays: number, overrides?: Partial<TCanonicalStageDeal>): TCanonicalStageDeal {
    const startDate = overrides?.start_date || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(new Date(startDate).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const durationSeconds = durationDays * 24 * 60 * 60;
    
    return this.build({
      start_date: startDate,
      end_date: endDate,
      duration_seconds: durationSeconds,
      ...overrides
    });
  }

  buildFast(overrides?: Partial<TCanonicalStageDeal>): TCanonicalStageDeal {
    return this.buildWithDuration(1 + Math.random() * 2, overrides); // 1-3 days
  }

  buildSlow(overrides?: Partial<TCanonicalStageDeal>): TCanonicalStageDeal {
    return this.buildWithDuration(10 + Math.random() * 10, overrides); // 10-20 days
  }
}

export class FlowMetricWithMappingFactory extends BaseFactory<TFlowMetricWithMapping> {
  private metricFactory = new FlowMetricConfigFactory();
  private mappingFactory = new CanonicalStageMappingFactory();

  build(overrides?: Partial<TFlowMetricWithMapping>): TFlowMetricWithMapping {
    const metric = this.metricFactory.build();
    const mapping = this.mappingFactory.buildForMetric(metric);
    
    return {
      ...metric,
      start_stage_id: mapping.start_stage_id,
      end_stage_id: mapping.end_stage_id,
      avg_min_days: mapping.avg_min_days,
      avg_max_days: mapping.avg_max_days,
      metric_comment: mapping.metric_comment,
      ...overrides
    };
  }

  // Convenience methods for common scenarios
  buildLeadConversion(overrides?: Partial<TFlowMetricWithMapping>): TFlowMetricWithMapping {
    const metric = this.metricFactory.buildLeadConversion();
    const mapping = this.mappingFactory.buildForMetric(metric, {
      start_stage_id: PREDEFINED_METRICS.LEAD_CONVERSION.start_stage_id,
      end_stage_id: PREDEFINED_METRICS.LEAD_CONVERSION.end_stage_id,
      avg_min_days: PREDEFINED_METRICS.LEAD_CONVERSION.avg_min_days,
      avg_max_days: PREDEFINED_METRICS.LEAD_CONVERSION.avg_max_days
    });
    
    return {
      ...metric,
      start_stage_id: mapping.start_stage_id,
      end_stage_id: mapping.end_stage_id,
      avg_min_days: mapping.avg_min_days,
      avg_max_days: mapping.avg_max_days,
      metric_comment: mapping.metric_comment,
      ...overrides
    };
  }

  buildManufacturing(overrides?: Partial<TFlowMetricWithMapping>): TFlowMetricWithMapping {
    const metric = this.metricFactory.buildManufacturing();
    const mapping = this.mappingFactory.buildForMetric(metric, {
      start_stage_id: PREDEFINED_METRICS.MANUFACTURING.start_stage_id,
      end_stage_id: PREDEFINED_METRICS.MANUFACTURING.end_stage_id,
      avg_min_days: PREDEFINED_METRICS.MANUFACTURING.avg_min_days,
      avg_max_days: PREDEFINED_METRICS.MANUFACTURING.avg_max_days
    });
    
    return {
      ...metric,
      start_stage_id: mapping.start_stage_id,
      end_stage_id: mapping.end_stage_id,
      avg_min_days: mapping.avg_min_days,
      avg_max_days: mapping.avg_max_days,
      metric_comment: mapping.metric_comment,
      ...overrides
    };
  }

  buildWithThresholds(minDays: number, maxDays: number, overrides?: Partial<TFlowMetricWithMapping>): TFlowMetricWithMapping {
    const metric = this.metricFactory.build();
    const mapping = this.mappingFactory.buildWithThresholds(minDays, maxDays);
    
    return {
      ...metric,
      start_stage_id: mapping.start_stage_id,
      end_stage_id: mapping.end_stage_id,
      avg_min_days: mapping.avg_min_days,
      avg_max_days: mapping.avg_max_days,
      metric_comment: mapping.metric_comment,
      ...overrides
    };
  }
}

// Convenience instances
export const flowMetricConfigFactory = new FlowMetricConfigFactory();
export const canonicalStageMappingFactory = new CanonicalStageMappingFactory();
export const pipedriveDealFlowDataFactory = new PipedriveDealFlowDataFactory();
export const canonicalStageDealFactory = new CanonicalStageDealFactory();
export const flowMetricWithMappingFactory = new FlowMetricWithMappingFactory();

// Pre-built test data sets for common scenarios
export const TEST_DATA_SETS = {
  // Complete flow metrics configuration with realistic data
  COMPLETE_FLOW_METRICS: () => {
    const metrics = [
      flowMetricConfigFactory.buildLeadConversion(),
      flowMetricConfigFactory.buildManufacturing(),
      flowMetricConfigFactory.build(PREDEFINED_METRICS.QUOTE_CONVERSION),
      flowMetricConfigFactory.build(PREDEFINED_METRICS.ORDER_CONVERSION),
      flowMetricConfigFactory.build(PREDEFINED_METRICS.DELIVERY)
    ];

    const mappings = metrics.map(metric => 
      canonicalStageMappingFactory.buildForMetric(metric)
    );

    return { metrics, mappings };
  },

  // Manufacturing metric with flow data
  MANUFACTURING_WITH_FLOW_DATA: () => {
    const metric = flowMetricWithMappingFactory.buildManufacturing();
    const flowData = pipedriveDealFlowDataFactory.buildMany(5, {
      deal_id: 1467,
      stage_id: metric.start_stage_id
    });

    return { metric, flowData };
  },

  // Multiple deals with varying performance
  PERFORMANCE_VARIATION: () => {
    const deals = [
      canonicalStageDealFactory.buildFast({ deal_id: 'fast-1' }),
      canonicalStageDealFactory.buildFast({ deal_id: 'fast-2' }),
      canonicalStageDealFactory.buildWithDuration(5, { deal_id: 'medium-1' }),
      canonicalStageDealFactory.buildWithDuration(5, { deal_id: 'medium-2' }),
      canonicalStageDealFactory.buildSlow({ deal_id: 'slow-1' }),
      canonicalStageDealFactory.buildSlow({ deal_id: 'slow-2' })
    ];

    return { deals };
  },

  // Empty state for testing
  EMPTY_STATE: () => {
    return {
      metrics: [],
      mappings: [],
      flowData: [],
      deals: []
    };
  }
};
