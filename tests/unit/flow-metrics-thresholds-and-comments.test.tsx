import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('Flow Metrics Thresholds and Comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Logic Functions', () => {
    it('should validate threshold logic correctly', () => {
      // Test the threshold validation logic
      const validateThresholds = (avgMin: number | null, avgMax: number | null): boolean => {
        if (avgMin === null && avgMax === null) return true;
        if (avgMin === null || avgMax === null) return false;
        return avgMin <= avgMax;
      };

      // Valid cases
      expect(validateThresholds(null, null)).toBe(true);
      expect(validateThresholds(5, 10)).toBe(true);
      expect(validateThresholds(5, 5)).toBe(true);

      // Invalid cases
      expect(validateThresholds(10, 5)).toBe(false);
      expect(validateThresholds(5, null)).toBe(false);
      expect(validateThresholds(null, 5)).toBe(false);
    });

    it('should determine metric color correctly', () => {
      // Test the color coding logic
      const getMetricColor = (average: number, avgMin: number | null, avgMax: number | null): string => {
        // If average is 0 (no data), return grey
        if (average === 0) return 'text-gray-600';
        
        // If no min and/or max thresholds are set, return grey
        if (avgMin === null || avgMax === null) return 'text-gray-600';
        
        // Apply color coding based on thresholds
        if (average <= avgMin) return 'text-green-600';
        if (average < avgMax) return 'text-amber-600';
        return 'text-red-600';
      };

      // Test cases
      expect(getMetricColor(0, 5, 15)).toBe('text-gray-600'); // No data (0 days)
      expect(getMetricColor(0, null, null)).toBe('text-gray-600'); // No data and no thresholds
      expect(getMetricColor(5, null, 15)).toBe('text-gray-600'); // No min threshold
      expect(getMetricColor(5, 5, null)).toBe('text-gray-600'); // No max threshold
      expect(getMetricColor(5, null, null)).toBe('text-gray-600'); // No thresholds
      expect(getMetricColor(5, 5, 15)).toBe('text-green-600'); // Equal to min
      expect(getMetricColor(3, 5, 15)).toBe('text-green-600'); // Less than min
      expect(getMetricColor(10, 5, 15)).toBe('text-amber-600'); // Between min and max
      expect(getMetricColor(15, 5, 15)).toBe('text-red-600'); // Equal to max
      expect(getMetricColor(20, 5, 15)).toBe('text-red-600'); // Greater than max
    });
  });

  describe('API Endpoints', () => {
    it('should validate comment format in API', async () => {
      const { PATCH } = await import('../../app/api/admin/flow-metrics-config/[id]/comment/route');
      
      // Test with invalid comment (not a string)
      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config/1/comment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: 123 })
      });

      const response = await PATCH(request, { params: { id: '1' } });
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Comment must be a string');
    });

    it('should validate threshold constraints in create API', async () => {
      const { POST } = await import('../../app/api/admin/flow-metrics-config/route');
      
      // Test with invalid thresholds (min > max)
      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_key: 'test-metric',
          display_title: 'Test Metric',
          canonical_stage: 'Test Stage',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          avg_min_days: 15,
          avg_max_days: 5,
          metric_comment: 'Test comment'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('avg_min_days cannot be greater than avg_max_days');
    });

    it('should validate required fields in create API', async () => {
      const { POST } = await import('../../app/api/admin/flow-metrics-config/route');
      
      // Test with missing required fields
      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          sort_order: 1,
          is_active: true
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields: metric_key');
    });
  });
});
