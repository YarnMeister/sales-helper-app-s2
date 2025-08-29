import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/pipedrive-webhook/route';

// Mock the dependencies
vi.mock('../../lib/pipedrive', () => ({
  fetchDealFlow: vi.fn(),
}));

vi.mock('../../lib/db', () => ({
  insertDealFlowData: vi.fn(),
}));

vi.mock('../../lib/log', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  withPerformanceLogging: vi.fn((operation, context, fn) => fn()),
}));

describe('Zapier Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.ZAPIER_WEBHOOK_SECRET = 'test-secret';
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/pipedrive-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zapier-Secret': 'test-secret',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  describe('Phase 1: Basic Webhook Validation', () => {
    it('should accept valid deal_id as number', async () => {
      // Mock successful flow data fetch
      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      const mockFlowData = [
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 1, 
            item_id: 12345, 
            new_value: '2',
            additional_data: { new_value_formatted: 'Stage 2' },
            timestamp: '2025-01-01T00:00:00Z'
          }
        }
      ];
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.phase).toBe(2); // Now Phase 2
      expect(data.correlationId).toBe('test-correlation-id');
    });

    it('should accept valid deal_id as string', async () => {
      // Mock successful flow data fetch
      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      const mockFlowData = [
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 1, 
            item_id: 12345, 
            new_value: '2',
            additional_data: { new_value_formatted: 'Stage 2' },
            timestamp: '2025-01-01T00:00:00Z'
          }
        }
      ];
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: '12345' });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.phase).toBe(2);
    });

    it('should reject invalid deal_id', async () => {
      const request = createMockRequest({ deal_id: 'invalid' });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing deal_id', async () => {
      const request = createMockRequest({});
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid HTTP method', async () => {
      const request = new NextRequest('http://localhost:3000/api/pipedrive-webhook', {
        method: 'GET',
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(405);
      expect(data.error).toBe('Method Not Allowed');
    });

    it('should reject missing secret header', async () => {
      const request = createMockRequest({ deal_id: 12345 }, { 'X-Zapier-Secret': undefined as any });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should reject invalid secret', async () => {
      const request = createMockRequest({ deal_id: 12345 }, { 'X-Zapier-Secret': 'wrong-secret' });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should handle missing environment variable', async () => {
      delete process.env.ZAPIER_WEBHOOK_SECRET;
      
      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(503);
      expect(data.error).toBe('Webhook not configured');
      
      // Restore for other tests
      process.env.ZAPIER_WEBHOOK_SECRET = 'test-secret';
    });
  });

  describe('Phase 2: Flow Data Processing', () => {
    it('should successfully fetch and store flow data', async () => {
      const mockFlowData = [
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 1, 
            item_id: 12345, 
            new_value: '2',
            additional_data: { new_value_formatted: 'Stage 2' },
            timestamp: '2025-01-01T00:00:00Z'
          }
        },
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 2, 
            item_id: 12345, 
            new_value: '3',
            additional_data: { new_value_formatted: 'Stage 3' },
            timestamp: '2025-01-02T00:00:00Z'
          }
        }
      ];

      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.phase).toBe(2);
      expect(data.flowEventsCount).toBe(2);
      expect(data.message).toContain('flow data fetched and stored');
      
      expect(fetchDealFlow).toHaveBeenCalledWith(12345);
      expect(insertDealFlowData).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          pipedrive_event_id: 1,
          deal_id: 12345,
          stage_id: 2
        })
      ]));
    });

    it('should handle empty flow data', async () => {
      const mockFlowData: any[] = [];

      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('partial_success');
      expect(data.phase).toBe(1);
      expect(data.error).toBe('No flow data found for this deal');
      
      expect(fetchDealFlow).toHaveBeenCalledWith(12345);
      expect(insertDealFlowData).not.toHaveBeenCalled();
    });

    it('should handle fetchDealFlow error gracefully', async () => {
      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockRejectedValue(new Error('Pipedrive API error'));
      vi.mocked(insertDealFlowData).mockResolvedValue();

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200); // Still returns 200
      expect(data.status).toBe('partial_success');
      expect(data.phase).toBe(1);
      expect(data.error).toBe('Pipedrive API error');
      expect(data.message).toContain('flow processing failed');
      
      expect(fetchDealFlow).toHaveBeenCalledWith(12345);
      expect(insertDealFlowData).not.toHaveBeenCalled();
    });

    it('should handle insertDealFlowData error gracefully', async () => {
      const mockFlowData = [
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 1, 
            item_id: 12345, 
            new_value: '2',
            additional_data: { new_value_formatted: 'Stage 2' },
            timestamp: '2025-01-01T00:00:00Z'
          }
        }
      ];

      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200); // Still returns 200
      expect(data.status).toBe('partial_success');
      expect(data.phase).toBe(1);
      expect(data.error).toBe('Database error');
      expect(data.message).toContain('flow processing failed');
      
      expect(fetchDealFlow).toHaveBeenCalledWith(12345);
      expect(insertDealFlowData).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          pipedrive_event_id: 1,
          deal_id: 12345
        })
      ]));
    });

    it('should handle null/undefined flow data', async () => {
      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockResolvedValue(null);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: 12345 });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('partial_success');
      expect(data.phase).toBe(1);
      expect(data.error).toBe('No flow data found for this deal');
      
      expect(fetchDealFlow).toHaveBeenCalledWith(12345);
      expect(insertDealFlowData).not.toHaveBeenCalled();
    });
  });

  describe('Integration: End-to-End Workflow', () => {
    it('should complete full workflow successfully', async () => {
      const mockFlowData = [
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 1, 
            item_id: 67890, 
            new_value: '2',
            additional_data: { new_value_formatted: 'Stage 2' },
            timestamp: '2025-01-01T00:00:00Z'
          }
        },
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 2, 
            item_id: 67890, 
            new_value: '3',
            additional_data: { new_value_formatted: 'Stage 3' },
            timestamp: '2025-01-02T00:00:00Z'
          }
        },
        { 
          object: 'dealChange', 
          data: { 
            field_key: 'stage_id', 
            id: 3, 
            item_id: 67890, 
            new_value: '4',
            additional_data: { new_value_formatted: 'Stage 4' },
            timestamp: '2025-01-03T00:00:00Z'
          }
        }
      ];

      const { fetchDealFlow } = await import('../../lib/pipedrive');
      const { insertDealFlowData } = await import('../../lib/db');
      
      vi.mocked(fetchDealFlow).mockResolvedValue(mockFlowData);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);

      const request = createMockRequest({ deal_id: 67890 });
      
      const response = await POST(request);
      const data = await response.json();
      
      // Verify complete success
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.phase).toBe(2);
      expect(data.flowEventsCount).toBe(3);
      expect(data.correlationId).toBe('test-correlation-id');
      expect(data.message).toContain('processed successfully');
      expect(data.message).toContain('flow data fetched and stored');
      
      // Verify all functions were called correctly
      expect(fetchDealFlow).toHaveBeenCalledTimes(1);
      expect(fetchDealFlow).toHaveBeenCalledWith(67890);
      expect(insertDealFlowData).toHaveBeenCalledTimes(1);
      expect(insertDealFlowData).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          pipedrive_event_id: 1,
          deal_id: 67890
        }),
        expect.objectContaining({
          pipedrive_event_id: 2,
          deal_id: 67890
        }),
        expect.objectContaining({
          pipedrive_event_id: 3,
          deal_id: 67890
        })
      ]));
    });
  });
});
