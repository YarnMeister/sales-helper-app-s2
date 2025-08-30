import { describe, it, expect, beforeEach } from 'vitest';
import {
  flowMetricConfigFactory,
  canonicalStageMappingFactory,
  pipedriveDealFlowDataFactory,
  canonicalStageDealFactory,
  flowMetricWithMappingFactory,
  TEST_DATA_SETS,
  PREDEFINED_METRICS,
  STAGE_NAMES
} from '../_factories/flow-metrics-factory';

describe('Flow Metrics Factory', () => {
  beforeEach(() => {
    // Reset factory sequences for consistent testing
    flowMetricConfigFactory['sequence'] = 1;
    canonicalStageMappingFactory['sequence'] = 1;
    pipedriveDealFlowDataFactory['sequence'] = 1;
    canonicalStageDealFactory['sequence'] = 1;
    flowMetricWithMappingFactory['sequence'] = 1;
  });

  describe('FlowMetricConfigFactory', () => {
    it('should create basic flow metric config', () => {
      const metric = flowMetricConfigFactory.build();
      
      expect(metric.id).toMatch(/^metric-\d{3}$/);
      expect(metric.metric_key).toMatch(/^metric-\d+$/);
      expect(metric.display_title).toMatch(/^Test Metric \d+$/);
      expect(metric.canonical_stage).toMatch(/^Stage \d+$/);
      expect(metric.sort_order).toBeGreaterThan(0);
      expect(metric.is_active).toBe(true);
      expect(metric.created_at).toBeDefined();
      expect(metric.updated_at).toBeDefined();
    });

    it('should create lead conversion metric', () => {
      const metric = flowMetricConfigFactory.buildLeadConversion();
      
      expect(metric.metric_key).toBe('lead-conversion');
      expect(metric.display_title).toBe('Lead Conversion Time');
      expect(metric.canonical_stage).toBe('Lead Conversion');
      expect(metric.sort_order).toBe(1);
      expect(metric.is_active).toBe(true);
    });

    it('should create manufacturing metric', () => {
      const metric = flowMetricConfigFactory.buildManufacturing();
      
      expect(metric.metric_key).toBe('manufacturing');
      expect(metric.display_title).toBe('Manufacturing Lead Time');
      expect(metric.canonical_stage).toBe('Manufacturing');
      expect(metric.sort_order).toBe(4);
      expect(metric.is_active).toBe(true);
    });

    it('should create inactive metric', () => {
      const metric = flowMetricConfigFactory.buildInactive();
      
      expect(metric.is_active).toBe(false);
    });

    it('should create multiple metrics with buildMany', () => {
      const metrics = flowMetricConfigFactory.buildMany(3);
      
      expect(metrics).toHaveLength(3);
      expect(metrics[0].id).not.toBe(metrics[1].id);
      expect(metrics[1].id).not.toBe(metrics[2].id);
    });
  });

  describe('CanonicalStageMappingFactory', () => {
    it('should create basic canonical stage mapping', () => {
      const mapping = canonicalStageMappingFactory.build();
      
      expect(mapping.id).toMatch(/^mapping-\d{3}$/);
      expect(mapping.metric_config_id).toMatch(/^metric-\d{3}$/);
      expect(mapping.canonical_stage).toMatch(/^Stage \d+$/);
      expect(mapping.start_stage).toBeDefined();
      expect(mapping.end_stage).toBeDefined();
      expect(mapping.start_stage_id).toBeGreaterThan(0);
      expect(mapping.end_stage_id).toBeGreaterThan(mapping.start_stage_id!);
      expect(mapping.avg_min_days).toBeGreaterThan(0);
      expect(mapping.avg_max_days).toBeGreaterThanOrEqual(mapping.avg_min_days!);
      expect(mapping.metric_comment).toMatch(/^Test comment for \d+$/);
    });

    it('should create mapping for specific metric', () => {
      const metric = flowMetricConfigFactory.buildLeadConversion();
      const mapping = canonicalStageMappingFactory.buildForMetric(metric);
      
      expect(mapping.metric_config_id).toBe(metric.id);
      expect(mapping.canonical_stage).toBe(metric.canonical_stage);
    });

    it('should create mapping with specific thresholds', () => {
      const mapping = canonicalStageMappingFactory.buildWithThresholds(3, 10);
      
      expect(mapping.avg_min_days).toBe(3);
      expect(mapping.avg_max_days).toBe(10);
    });
  });

  describe('PipedriveDealFlowDataFactory', () => {
    it('should create basic deal flow data', () => {
      const flowData = pipedriveDealFlowDataFactory.build();
      
      expect(flowData.id).toMatch(/^flow-\d{3}$/);
      expect(flowData.pipedrive_event_id).toBeGreaterThan(0);
      expect(flowData.deal_id).toBeGreaterThan(0);
      expect(flowData.pipeline_id).toBe(1);
      expect(flowData.stage_id).toBeGreaterThan(0);
      expect(flowData.stage_name).toBeDefined();
      expect(flowData.entered_at).toBeDefined();
      expect(flowData.left_at).toBeDefined();
      expect(flowData.duration_seconds).toBeGreaterThan(0);
      expect(flowData.created_at).toBeDefined();
      expect(flowData.updated_at).toBeDefined();
    });

    it('should create flow data for specific deal', () => {
      const flowData = pipedriveDealFlowDataFactory.buildForDeal(1467);
      
      expect(flowData.deal_id).toBe(1467);
    });

    it('should create flow data for specific stage', () => {
      const flowData = pipedriveDealFlowDataFactory.buildForStage(5, 'Quality Control');
      
      expect(flowData.stage_id).toBe(5);
      expect(flowData.stage_name).toBe('Quality Control');
    });

    it('should create flow data with specific duration', () => {
      const flowData = pipedriveDealFlowDataFactory.buildWithDuration(7);
      
      const durationDays = flowData.duration_seconds! / (24 * 60 * 60);
      expect(durationDays).toBeCloseTo(7, 0);
    });

    it('should create incomplete flow data', () => {
      const flowData = pipedriveDealFlowDataFactory.buildIncomplete();
      
      expect(flowData.left_at).toBeUndefined();
      expect(flowData.duration_seconds).toBeUndefined();
    });
  });

  describe('CanonicalStageDealFactory', () => {
    it('should create basic canonical stage deal', () => {
      const deal = canonicalStageDealFactory.build();
      
      expect(deal.deal_id).toMatch(/^deal-\d{3}$/);
      expect(deal.start_date).toBeDefined();
      expect(deal.end_date).toBeDefined();
      expect(deal.duration_seconds).toBeGreaterThan(0);
      
      const startTime = new Date(deal.start_date).getTime();
      const endTime = new Date(deal.end_date).getTime();
      const calculatedDuration = (endTime - startTime) / 1000;
      expect(deal.duration_seconds).toBeCloseTo(calculatedDuration, 1);
    });

    it('should create deal with specific duration', () => {
      const deal = canonicalStageDealFactory.buildWithDuration(5);
      
      const durationDays = deal.duration_seconds / (24 * 60 * 60);
      expect(durationDays).toBeCloseTo(5, 0);
    });

    it('should create fast deals', () => {
      const deal = canonicalStageDealFactory.buildFast();
      
      const durationDays = deal.duration_seconds / (24 * 60 * 60);
      expect(durationDays).toBeGreaterThanOrEqual(1);
      expect(durationDays).toBeLessThanOrEqual(3);
    });

    it('should create slow deals', () => {
      const deal = canonicalStageDealFactory.buildSlow();
      
      const durationDays = deal.duration_seconds / (24 * 60 * 60);
      expect(durationDays).toBeGreaterThanOrEqual(10);
      expect(durationDays).toBeLessThanOrEqual(20);
    });
  });

  describe('FlowMetricWithMappingFactory', () => {
    it('should create flow metric with mapping', () => {
      const metricWithMapping = flowMetricWithMappingFactory.build();
      
      expect(metricWithMapping.id).toMatch(/^metric-\d{3}$/);
      expect(metricWithMapping.start_stage_id).toBeDefined();
      expect(metricWithMapping.end_stage_id).toBeDefined();
      expect(metricWithMapping.avg_min_days).toBeDefined();
      expect(metricWithMapping.avg_max_days).toBeDefined();
      expect(metricWithMapping.metric_comment).toBeDefined();
    });

    it('should create lead conversion with mapping', () => {
      const metricWithMapping = flowMetricWithMappingFactory.buildLeadConversion();
      
      expect(metricWithMapping.metric_key).toBe('lead-conversion');
      expect(metricWithMapping.display_title).toBe('Lead Conversion Time');
      expect(metricWithMapping.canonical_stage).toBe('Lead Conversion');
      expect(metricWithMapping.start_stage_id).toBe(PREDEFINED_METRICS.LEAD_CONVERSION.start_stage_id);
      expect(metricWithMapping.end_stage_id).toBe(PREDEFINED_METRICS.LEAD_CONVERSION.end_stage_id);
      expect(metricWithMapping.avg_min_days).toBe(PREDEFINED_METRICS.LEAD_CONVERSION.avg_min_days);
      expect(metricWithMapping.avg_max_days).toBe(PREDEFINED_METRICS.LEAD_CONVERSION.avg_max_days);
    });

    it('should create manufacturing with mapping', () => {
      const metricWithMapping = flowMetricWithMappingFactory.buildManufacturing();
      
      expect(metricWithMapping.metric_key).toBe('manufacturing');
      expect(metricWithMapping.display_title).toBe('Manufacturing Lead Time');
      expect(metricWithMapping.canonical_stage).toBe('Manufacturing');
      expect(metricWithMapping.start_stage_id).toBe(PREDEFINED_METRICS.MANUFACTURING.start_stage_id);
      expect(metricWithMapping.end_stage_id).toBe(PREDEFINED_METRICS.MANUFACTURING.end_stage_id);
      expect(metricWithMapping.avg_min_days).toBe(PREDEFINED_METRICS.MANUFACTURING.avg_min_days);
      expect(metricWithMapping.avg_max_days).toBe(PREDEFINED_METRICS.MANUFACTURING.avg_max_days);
    });

    it('should create metric with specific thresholds', () => {
      const metricWithMapping = flowMetricWithMappingFactory.buildWithThresholds(2, 8);
      
      expect(metricWithMapping.avg_min_days).toBe(2);
      expect(metricWithMapping.avg_max_days).toBe(8);
    });
  });

  describe('TEST_DATA_SETS', () => {
    it('should create complete flow metrics data set', () => {
      const { metrics, mappings } = TEST_DATA_SETS.COMPLETE_FLOW_METRICS();
      
      expect(metrics).toHaveLength(5);
      expect(mappings).toHaveLength(5);
      
      // Check that mappings correspond to metrics
      mappings.forEach((mapping, index) => {
        expect(mapping.metric_config_id).toBe(metrics[index].id);
        expect(mapping.canonical_stage).toBe(metrics[index].canonical_stage);
      });
    });

    it('should create manufacturing with flow data', () => {
      const { metric, flowData } = TEST_DATA_SETS.MANUFACTURING_WITH_FLOW_DATA();
      
      expect(metric.metric_key).toBe('manufacturing');
      expect(flowData).toHaveLength(5);
      flowData.forEach(data => {
        expect(data.deal_id).toBe(1467);
        expect(data.stage_id).toBe(metric.start_stage_id);
      });
    });

    it('should create performance variation data', () => {
      const { deals } = TEST_DATA_SETS.PERFORMANCE_VARIATION();
      
      expect(deals).toHaveLength(6);
      
      // Check fast deals
      const fastDeals = deals.filter(deal => deal.deal_id.startsWith('fast-'));
      expect(fastDeals).toHaveLength(2);
      fastDeals.forEach(deal => {
        const durationDays = deal.duration_seconds / (24 * 60 * 60);
        expect(durationDays).toBeLessThanOrEqual(3);
      });
      
      // Check slow deals
      const slowDeals = deals.filter(deal => deal.deal_id.startsWith('slow-'));
      expect(slowDeals).toHaveLength(2);
      slowDeals.forEach(deal => {
        const durationDays = deal.duration_seconds / (24 * 60 * 60);
        expect(durationDays).toBeGreaterThanOrEqual(10);
      });
    });

    it('should create empty state', () => {
      const emptyState = TEST_DATA_SETS.EMPTY_STATE();
      
      expect(emptyState.metrics).toHaveLength(0);
      expect(emptyState.mappings).toHaveLength(0);
      expect(emptyState.flowData).toHaveLength(0);
      expect(emptyState.deals).toHaveLength(0);
    });
  });

  describe('Constants', () => {
    it('should have predefined metrics', () => {
      expect(PREDEFINED_METRICS.LEAD_CONVERSION).toBeDefined();
      expect(PREDEFINED_METRICS.QUOTE_CONVERSION).toBeDefined();
      expect(PREDEFINED_METRICS.ORDER_CONVERSION).toBeDefined();
      expect(PREDEFINED_METRICS.MANUFACTURING).toBeDefined();
      expect(PREDEFINED_METRICS.DELIVERY).toBeDefined();
    });

    it('should have stage names', () => {
      expect(STAGE_NAMES).toHaveLength(13);
      expect(STAGE_NAMES).toContain('Lead Generated');
      expect(STAGE_NAMES).toContain('Quality Control');
      expect(STAGE_NAMES).toContain('Order Inv Paid');
    });
  });
});
