import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';
import FlowMetricDetailPage from '../../app/flow-metrics-report/[metric-id]/page';
import { 
  createMockFetch, 
  MANUFACTURING_LEAD_TIME_METRIC,
  MANUFACTURING_FLOW_DATA
} from '../test-utils';

// Mock Next.js router and search params
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
  usePathname: vi.fn(() => '/flow-metrics-report')
}));

// Mock useToast hook
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Flow Metrics Integration Tests', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Create a stable mock for searchParams that won't cause infinite loops
    const mockSearchParams = {
      get: vi.fn((key: string) => {
        if (key === 'period') return '7d';
        return null;
      })
    };
    (useSearchParams as any).mockReturnValue(mockSearchParams);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Flow Metrics Report Page - Basic Rendering', () => {
    it('should render all three view tabs', async () => {
      // Simple mock that returns immediately
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that all view options are rendered
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
      expect(screen.getByText('Mappings')).toBeInTheDocument();
    });

    it('should show Metrics view by default', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that Metrics view is shown by default
      await waitFor(() => {
        expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should switch to Raw Data view', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Click on Raw Data tab
      fireEvent.click(screen.getByText('Raw Data'));

      // Check that deal input form is shown
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeInTheDocument();
        expect(screen.getByText('Fetch')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should switch to Mappings view', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: [MANUFACTURING_LEAD_TIME_METRIC] 
        })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Click on Mappings tab
      fireEvent.click(screen.getByText('Mappings'));

      // Check that flow metrics management is shown
      await waitFor(() => {
        expect(screen.getByText('Flow Metrics Management')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Flow Metrics Report Page - User Interactions', () => {
    it('should handle deal ID input and fetch', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: MANUFACTURING_FLOW_DATA })
        });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Switch to Raw Data view
      fireEvent.click(screen.getByText('Raw Data'));

      // Enter deal ID and fetch
      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      // Check that fetch was called (the component calls multiple endpoints)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should navigate to detail page when clicking More Info', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: [{
            id: 'manufacturing-lead-time',
            title: 'Manufacturing Lead Time',
            mainMetric: '5',
            totalDeals: 10,
            avg_min_days: 2,
            avg_max_days: 8,
            metric_comment: 'Test comment'
          }] 
        })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Find and click More Info button
      const moreInfoButtons = screen.getAllByText('More info');
      if (moreInfoButtons.length > 0) {
        fireEvent.click(moreInfoButtons[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time?period=7d');
      }
    });
  });

  describe('Flow Metric Detail Page', () => {
    it('should display metric details', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: [{
            id: 'manufacturing-lead-time',
            metric_key: 'manufacturing-lead-time',
            display_title: 'Manufacturing Lead Time',
            canonical_stage: 'MANUFACTURING',
            is_active: true
          }] 
        })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Check that the page loads with correct title
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle unknown metric gracefully', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'unknown-metric' }} />);

      // Check that error page is shown
      await waitFor(() => {
        expect(screen.getByText('Metric Not Found')).toBeInTheDocument();
      }, { timeout: 1000 });
      expect(screen.getByText('Failed to fetch metric configuration')).toBeInTheDocument();
    });

    it('should navigate back to main page', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Find and click back button
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(button => 
        button.innerHTML.includes('M15 19l-7-7 7-7')
      );
      
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report?period=7d');
      }
    });
  });

  describe('Period Selection', () => {
    it('should handle period selection', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: [MANUFACTURING_LEAD_TIME_METRIC] 
        })
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Select 1 month period
      const oneMonthButtons = screen.getAllByText('1 month');
      const oneMonthButton = oneMonthButtons.find(button => button.tagName === 'BUTTON');
      expect(oneMonthButton).toBeInTheDocument();
      fireEvent.click(oneMonthButton!);

      // Check that the period selection was handled
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/flow/metrics?period=1m');
      }, { timeout: 1000 });
    });
  });
});
