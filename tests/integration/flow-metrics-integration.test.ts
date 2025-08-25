import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';
import FlowMetricDetailPage from '../../app/flow-metrics-report/[metric-id]/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

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
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<FlowMetricsReportPage />);

      // Check that all view options are rendered
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
      expect(screen.getByText('Mappings')).toBeInTheDocument();

      // Check that Metrics view is shown by default
      expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();
    });

    it('should switch to Raw Data view and show deal input form', async () => {
      // Mock initial data loading
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<FlowMetricsReportPage />);

      // Click on Raw Data tab
      fireEvent.click(screen.getByText('Raw Data'));

      // Check that deal input form is shown
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
        expect(screen.getByText('Fetch')).toBeInTheDocument();
      });
    });

    it('should switch to Mappings view and show canonical stage mappings', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      // Mock initial data loading
      (global.fetch as any)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockMappings })
        });

      render(<FlowMetricsReportPage />);

      // Click on Mappings tab
      fireEvent.click(screen.getByText('Mappings'));

      // Check that mappings table is shown
      await waitFor(() => {
        expect(screen.getByText('Canonical Stage Mappings')).toBeInTheDocument();
        expect(screen.getByText('Order Conversion')).toBeInTheDocument();
      });
    });

    it('should fetch and display deal flow data in Raw Data view', async () => {
      const mockFlowData = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      // Mock initial data loading
      (global.fetch as any)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockFlowData })
        });

      render(<FlowMetricsReportPage />);

      // Switch to Raw Data view
      fireEvent.click(screen.getByText('Raw Data'));

      // Enter deal ID and fetch
      const input = screen.getByPlaceholderText('Enter Deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      // Check that data is displayed
      await waitFor(() => {
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
      });
    });

    it('should navigate to detail page when clicking More Info', async () => {
      // Mock initial data loading
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<FlowMetricsReportPage />);

      // Find and click More Info button for Order Conversion
      const moreInfoButtons = screen.getAllByText('More info');
      const orderConversionButton = moreInfoButtons.find(button => 
        button.closest('.h-full')?.textContent?.includes('Order Conversion')
      );

      if (orderConversionButton) {
        fireEvent.click(orderConversionButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/order-conversion');
      }
    });
  });

  describe('Flow Metric Detail Page', () => {
    it('should fetch and display deals for a canonical stage', async () => {
      const mockDeals = [
        {
          deal_id: '1467',
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899
        },
        {
          deal_id: '1375',
          start_date: '2025-08-04T10:59:43.000Z',
          end_date: '2025-08-06T05:23:25.000Z',
          duration_seconds: 152622
        }
      ];

      // Mock the canonical stage deals API
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockDeals })
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'order-conversion' }} />);

      // Check that the page loads with correct title
      expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();

      // Check that deals are displayed
      await waitFor(() => {
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('1375')).toBeInTheDocument();
      });

      // Check that duration is calculated correctly
      await waitFor(() => {
        expect(screen.getByText('4 days')).toBeInTheDocument(); // 349899 seconds ≈ 4 days
        expect(screen.getByText('2 days')).toBeInTheDocument(); // 152622 seconds ≈ 2 days
      });
    });

    it('should handle missing canonical stage mapping', async () => {
      // Mock API returning no data
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'order-conversion' }} />);

      await waitFor(() => {
        expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<FlowMetricDetailPage params={{ 'metric-id': 'order-conversion' }} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch deals data')).toBeInTheDocument();
      });
    });

    it('should navigate back to main page', async () => {
      // Mock the canonical stage deals API
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'order-conversion' }} />);

      // Find and click back button
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full workflow: create mapping, fetch data, view details', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      const mockFlowData = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      const mockDeals = [
        {
          deal_id: '1467',
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899
        }
      ];

      // Mock all API calls
      (global.fetch as any)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockMappings })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockFlowData })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockDeals })
        });

      // Step 1: Render main page
      const { rerender } = render(<FlowMetricsReportPage />);

      // Step 2: Switch to Mappings view
      fireEvent.click(screen.getByText('Mappings'));

      await waitFor(() => {
        expect(screen.getByText('Canonical Stage Mappings')).toBeInTheDocument();
        expect(screen.getByText('Order Conversion')).toBeInTheDocument();
      });

      // Step 3: Switch to Raw Data view and fetch data
      fireEvent.click(screen.getByText('Raw Data'));

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
      });

      // Step 4: Switch back to Metrics view and click More Info
      fireEvent.click(screen.getByText('Metrics'));

      const moreInfoButtons = screen.getAllByText('More info');
      const orderConversionButton = moreInfoButtons.find(button => 
        button.closest('.h-full')?.textContent?.includes('Order Conversion')
      );

      if (orderConversionButton) {
        fireEvent.click(orderConversionButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/order-conversion');
      }

      // Step 5: Render detail page
      rerender(<FlowMetricDetailPage params={{ 'metric-id': 'order-conversion' }} />);

      await waitFor(() => {
        expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();
        expect(screen.getByText('1467')).toBeInTheDocument();
        expect(screen.getByText('4 days')).toBeInTheDocument();
      });
    });
  });
});
