import { vi } from 'vitest';

// Test timeout configuration
export const TEST_TIMEOUT = 180000; // 3 minutes

// Mock fetch with timeout protection
export const createMockFetch = (responses: Record<string, any>) => {
  return vi.fn().mockImplementation((url: string) => {
    // Handle URLs with query parameters by matching the base URL
    const baseUrl = url.split('?')[0];
    const response = responses[url] || responses[baseUrl] || responses['default'];
    
    if (response) {
      return Promise.resolve({
        ok: true,
        json: async () => response
      });
    }
    return Promise.reject(new Error(`Unexpected API call: ${url}`));
  });
};

// Mock useToast hook with stable reference
export const mockUseToast = () => ({
  toast: vi.fn()
});

// Test data for Manufacturing Lead Time (cornerstone test)
export const MANUFACTURING_LEAD_TIME_METRIC = {
  id: '1',
  metric_key: 'manufacturing-lead-time',
  display_title: 'Manufacturing Lead Time',
  canonical_stage: 'MANUFACTURING',
  sort_order: 1,
  is_active: true,
  start_stage_id: 5, // Quality Control
  end_stage_id: 8,   // Order Inv Paid
  created_at: '2025-08-11T12:28:28.000Z',
  updated_at: '2025-08-11T12:28:28.000Z'
};

// Mock flow data for Manufacturing Lead Time
export const MANUFACTURING_FLOW_DATA = [
  {
    id: '1',
    deal_id: 1467,
    pipeline_id: 1,
    stage_id: 5,
    stage_name: 'Quality Control',
    entered_at: '2025-08-11T12:28:28.000Z',
    left_at: undefined, // Changed from null to undefined
    duration_seconds: undefined, // Changed from null to undefined
    created_at: '2025-08-11T12:28:28.000Z',
    updated_at: '2025-08-12T10:15:00.000Z'
  },
  {
    id: '2',
    deal_id: 1467,
    pipeline_id: 1,
    stage_id: 8,
    stage_name: 'Order Inv Paid',
    entered_at: '2025-08-12T10:15:00.000Z',
    left_at: undefined, // Changed from null to undefined
    duration_seconds: undefined, // Changed from null to undefined
    created_at: '2025-08-12T10:15:00.000Z',
    updated_at: '2025-08-12T10:15:00.000Z'
  }
];

// Mock canonical stage deals data
export const CANONICAL_STAGE_DEALS_DATA = [
  {
    deal_id: 1467,
    start_date: '2025-08-11T12:28:28.000Z',
    end_date: '2025-08-12T10:15:00.000Z',
    duration_days: 1,
    duration_hours: 21,
    duration_minutes: 47
  }
];

// Setup function for flow metrics tests
export const setupFlowMetricsTest = () => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  vi.mock('../../app/hooks/use-toast', () => ({
    useToast: mockUseToast
  }));
};

// Cleanup function for flow metrics tests
export const cleanupFlowMetricsTest = () => {
  vi.resetAllMocks();
};
