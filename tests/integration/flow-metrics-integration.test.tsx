import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';
import FlowMetricDetailPage from '../../app/flow-metrics-report/[metric-id]/page';
import { 
  TEST_TIMEOUT, 
  createMockFetch, 
  MANUFACTURING_LEAD_TIME_METRIC,
  MANUFACTURING_FLOW_DATA
} from '../test-utils';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  usePathname: vi.fn()
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
    back: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Flow Metrics Report Page', () => {
    it('should render all three view tabs and allow navigation', async () => {
      // Mock initial data loading
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that all view options are rendered
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
      expect(screen.getByText('Mappings')).toBeInTheDocument();

      // Check that Metrics view is shown by default
      expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
    }, TEST_TIMEOUT);

    it('should switch to Raw Data view and show deal input form', async () => {
      // Mock initial data loading
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Click on Raw Data tab
      fireEvent.click(screen.getByText('Raw Data'));

      // Check that deal input form is shown
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeInTheDocument();
        expect(screen.getByText('Fetch')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should switch to Mappings view and show flow metrics management', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      // Mock initial data loading
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Click on Mappings tab
      fireEvent.click(screen.getByText('Mappings'));

      // Check that flow metrics management is shown
      await waitFor(() => {
        expect(screen.getByText('Flow Metrics Management')).toBeInTheDocument();
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should fetch and display deal flow data in Raw Data view', async () => {
      // Mock initial data loading
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/pipedrive/deal-flow': { success: true, data: MANUFACTURING_FLOW_DATA }
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

      // Check that data is displayed
      await waitFor(() => {
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
        expect(screen.getByText('Order Inv Paid')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should navigate to detail page when clicking More Info', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      // Mock initial data loading
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Find and click More Info button
      const moreInfoButtons = screen.getAllByText('More info');
      if (moreInfoButtons.length > 0) {
        fireEvent.click(moreInfoButtons[0]);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time');
      }
    });
  });

  describe('Flow Metric Detail Page', () => {
    it('should display manufacturing lead time metric details', async () => {
      // Mock the canonical stage deals API
      const mockFetch = createMockFetch({
        '/api/flow/canonical-stage-deals': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);

      // Check that the page loads with correct title
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();

      // Check that summary statistics are displayed
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('70 days')).toBeInTheDocument();
      expect(screen.getByText('Best Performance')).toBeInTheDocument();
      expect(screen.getByText('20 days')).toBeInTheDocument();
      expect(screen.getByText('Worst Performance')).toBeInTheDocument();
      expect(screen.getByText('120 days')).toBeInTheDocument();
    });

    it('should handle unknown metric gracefully', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'unknown-metric' }} />);

      // Check that error page is shown
      expect(screen.getByText('Metric Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested metric could not be found.')).toBeInTheDocument();
    });

    it('should navigate back to main page', async () => {
      // Mock the canonical stage deals API
      const mockFetch = createMockFetch({
        '/api/flow/canonical-stage-deals': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);

      // Find and click back button (first button with arrow icon)
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(button => 
        button.innerHTML.includes('M15 19l-7-7 7-7')
      );
      
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
      }
    });
  });

  describe('All Three Tabs Coverage', () => {
    it('should test Metrics tab functionality', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Verify Metrics tab is active by default
      expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
      
      // Verify metrics are displayed
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should test Raw Data tab functionality', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/pipedrive/deal-flow': { success: true, data: MANUFACTURING_FLOW_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Switch to Raw Data tab
      fireEvent.click(screen.getByText('Raw Data'));

      // Verify deal input form is shown
      expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeInTheDocument();

      // Test fetching data
      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
        expect(screen.getByText('Order Inv Paid')).toBeInTheDocument();
        expect(screen.getByText('Stage ID')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should test Mappings tab functionality', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Switch to Mappings tab
      fireEvent.click(screen.getByText('Mappings'));

      await waitFor(() => {
        expect(screen.getByText('Flow Metrics Management')).toBeInTheDocument();
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
        expect(screen.getByText('manufacturing-lead-time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Test Edit button functionality (cornerstone test)
      const editButtons = screen.getAllByText('Edit');
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByDisplayValue('Manufacturing Lead Time')).toBeInTheDocument();
          expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Start Stage ID
          expect(screen.getByDisplayValue('8')).toBeInTheDocument(); // End Stage ID
          expect(screen.getByText('Save')).toBeInTheDocument();
        }, { timeout: TEST_TIMEOUT });
      }
    });
  });
});
