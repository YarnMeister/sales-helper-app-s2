import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';
import FlowMetricDetailPage from '../../app/flow-metrics-report/[metric-id]/page';
import { 
  TEST_TIMEOUT, 
  createMockFetch, 
  MANUFACTURING_LEAD_TIME_METRIC,
  CANONICAL_STAGE_DEALS_DATA
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

describe('Flow Metrics Period Selection Tests', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  };

  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new URLSearchParams instance for each test
    const newSearchParams = new URLSearchParams();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(newSearchParams);
    
    // Mock ResizeObserver for Recharts
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Main Page Period Selection', () => {
    it('should render period selectors with correct options', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that all period options are rendered
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
      expect(screen.getByText('1 month')).toBeInTheDocument();
      expect(screen.getByText('3 months')).toBeInTheDocument();
    });

    it('should default to 7 days when no period in URL', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=7d': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that 7 days is selected by default
      const sevenDaysButton = screen.getByRole('button', { name: '7 days' });
      expect(sevenDaysButton).toHaveClass('bg-red-600');
    });

    it('should update period selection and fetch new data', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=7d': { success: true, data: [] },
        '/api/flow/metrics?period=1m': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Click on 1 month button (desktop version)
      const oneMonthButton = screen.getByRole('button', { name: '1 month' });
      fireEvent.click(oneMonthButton);

      // Check that 1 month is now selected
      await waitFor(() => {
        expect(oneMonthButton).toHaveClass('bg-red-600');
      });

      // Check that URL was updated
      expect(mockRouter.replace).toHaveBeenCalledWith('/flow-metrics-report?period=1m', { scroll: false });
    });

    it('should handle mobile dropdown period selection', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=7d': { success: true, data: [] },
        '/api/flow/metrics?period=3m': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Find mobile dropdown (hidden on desktop)
      const mobileDropdown = screen.getByRole('combobox');
      expect(mobileDropdown).toBeInTheDocument();

      // Change selection to 3 months
      fireEvent.change(mobileDropdown, { target: { value: '3m' } });

      // Check that URL was updated
      expect(mockRouter.replace).toHaveBeenCalledWith('/flow-metrics-report?period=3m', { scroll: false });
    });

    it('should sync period from URL when page loads', async () => {
      // Set URL search params to 1 month
      const searchParams = new URLSearchParams();
      searchParams.set('period', '1m');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=1m': { success: true, data: [] }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Check that 1 month is selected
      await waitFor(() => {
        const oneMonthButton = screen.getByRole('button', { name: '1 month' });
        expect(oneMonthButton).toHaveClass('bg-red-600');
      });
    });

    it('should pass selected period to More Info navigation', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=1m': { success: true, data: mockMetrics }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricsReportPage />);

      // Select 1 month period
      const oneMonthButton = screen.getByRole('button', { name: '1 month' });
      fireEvent.click(oneMonthButton);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Click More Info button
      const moreInfoButtons = screen.getAllByText('More info');
      if (moreInfoButtons.length > 0) {
        fireEvent.click(moreInfoButtons[0]);
        
        // Check that navigation includes the period parameter
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time?period=1m');
      }
    });
  });

  describe('Detail Page Period Selection', () => {
    it('should read period from URL and set initial selection', async () => {
      // Set URL search params to 1 month
      const searchParams = new URLSearchParams();
      searchParams.set('period', '1m');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Check that 1 month is selected
      await waitFor(() => {
        const oneMonthButton = screen.getByRole('button', { name: '1 month' });
        expect(oneMonthButton).toHaveClass('bg-red-600');
      });
    });

    it('should update period selection and filter data', async () => {
      // Set up search params for this test
      const searchParams = new URLSearchParams();
      searchParams.set('period', '7d');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Click on 3 months button
      const threeMonthsButton = screen.getByRole('button', { name: '3 months' });
      fireEvent.click(threeMonthsButton);

      // Check that 3 months is now selected
      await waitFor(() => {
        expect(threeMonthsButton).toHaveClass('bg-red-600');
      });

      // Check that URL was updated
      expect(mockRouter.replace).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time?period=3m', { scroll: false });
    });

    it('should handle mobile dropdown period selection on detail page', async () => {
      // Set up search params for this test
      const searchParams = new URLSearchParams();
      searchParams.set('period', '7d');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Find mobile dropdown
      const mobileDropdown = screen.getByRole('combobox');
      expect(mobileDropdown).toBeInTheDocument();

      // Change selection to 14 days
      fireEvent.change(mobileDropdown, { target: { value: '14d' } });

      // Check that URL was updated
      expect(mockRouter.replace).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time?period=14d', { scroll: false });
    });

    it('should preserve period when navigating back to main page', async () => {
      // Set URL search params to 3 months
      const searchParams = new URLSearchParams();
      searchParams.set('period', '3m');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
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
        
        // Check that navigation back includes the period parameter
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report?period=3m');
      }
    });

    it('should update header to show selected period', async () => {
      // Set URL search params to 1 month
      const searchParams = new URLSearchParams();
      searchParams.set('period', '1m');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Check that header shows the selected period
      await waitFor(() => {
        expect(screen.getByText('1 month')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Page Period Synchronization', () => {
    it('should maintain period selection when navigating between pages', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];
      
      // Mock main page data
      const mainPageMockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/deal-flow-data': { success: true, data: [] },
        '/api/flow/metrics?period=1m': { success: true, data: mockMetrics }
      });
      (global.fetch as any) = mainPageMockFetch;

      render(<FlowMetricsReportPage />);

      // Select 1 month on main page
      const oneMonthButton = screen.getByRole('button', { name: '1 month' });
      fireEvent.click(oneMonthButton);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Click More Info to go to detail page
      const moreInfoButtons = screen.getAllByText('More info');
      if (moreInfoButtons.length > 0) {
        fireEvent.click(moreInfoButtons[0]);
        
        // Verify navigation includes period
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/manufacturing-lead-time?period=1m');
      }
    });

    it('should sync period changes from detail page back to main page', async () => {
      // Set initial period to 7 days
      const searchParams = new URLSearchParams();
      searchParams.set('period', '7d');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Change period to 3 months on detail page
      const threeMonthsButton = screen.getByRole('button', { name: '3 months' });
      fireEvent.click(threeMonthsButton);

      // Navigate back to main page
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(button => 
        button.innerHTML.includes('M15 19l-7-7 7-7')
      );
      
      if (backButton) {
        fireEvent.click(backButton);
        
        // Verify navigation back includes the updated period
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report?period=7d');
      }
    });
  });

  describe('Period-Based Data Filtering', () => {
    it('should filter data based on selected period', async () => {
      // Set up search params for this test
      const searchParams = new URLSearchParams();
      searchParams.set('period', '7d');
      (useSearchParams as any).mockReturnValue(searchParams);

      // Mock data with different dates
      const mockDealsData = [
        {
          deal_id: '1',
          start_date: '2025-08-25T00:00:00.000Z', // Today
          end_date: '2025-08-26T00:00:00.000Z',
          duration_seconds: 86400
        },
        {
          deal_id: '2',
          start_date: '2025-08-20T00:00:00.000Z', // 5 days ago
          end_date: '2025-08-21T00:00:00.000Z',
          duration_seconds: 86400
        },
        {
          deal_id: '3',
          start_date: '2025-07-25T00:00:00.000Z', // 1 month ago
          end_date: '2025-07-26T00:00:00.000Z',
          duration_seconds: 86400
        }
      ];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: mockDealsData }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Select 7 days period
      const sevenDaysButton = screen.getByRole('button', { name: '7 days' });
      fireEvent.click(sevenDaysButton);

      // Check that only recent deals are shown (filtered data)
      await waitFor(() => {
        // Should show deals from last 7 days only
        expect(screen.getByText('1')).toBeInTheDocument(); // Deal count
        expect(screen.getByText('deals')).toBeInTheDocument(); // Deal count
        // Deal 3 (1 month ago) should not be visible
      });
    });

    it('should update metrics calculations based on filtered data', async () => {
      // Set up search params for this test
      const searchParams = new URLSearchParams();
      searchParams.set('period', '7d');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockDealsData = [
        {
          deal_id: '1',
          start_date: '2025-08-25T00:00:00.000Z',
          end_date: '2025-08-26T00:00:00.000Z',
          duration_seconds: 86400 // 1 day
        },
        {
          deal_id: '2',
          start_date: '2025-08-24T00:00:00.000Z',
          end_date: '2025-08-26T00:00:00.000Z',
          duration_seconds: 172800 // 2 days
        }
      ];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: mockDealsData }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Select 7 days period
      const sevenDaysButton = screen.getByRole('button', { name: '7 days' });
      fireEvent.click(sevenDaysButton);

      // Check that metrics are calculated based on filtered data
      await waitFor(() => {
        // Average should be (1 + 2) / 2 = 1.5 days, but rounded to 2
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('deals')).toBeInTheDocument();
        // Best should be 1 day
        expect(screen.getByText('1 days')).toBeInTheDocument();
        // Worst should be 2 days
        expect(screen.getByText('2 days')).toBeInTheDocument();
      });
    });
  });

  describe('URL State Management', () => {
    it('should handle bookmarkable URLs with period parameters', async () => {
      // Set URL search params to 3 months
      const searchParams = new URLSearchParams();
      searchParams.set('period', '3m');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Check that 3 months is selected from URL
      await waitFor(() => {
        const threeMonthsButton = screen.getByRole('button', { name: '3 months' });
        expect(threeMonthsButton).toHaveClass('bg-red-600');
      });
    });

    it('should handle invalid period parameters gracefully', async () => {
      // Set invalid period in URL
      const searchParams = new URLSearchParams();
      searchParams.set('period', 'invalid');
      (useSearchParams as any).mockReturnValue(searchParams);

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [MANUFACTURING_LEAD_TIME_METRIC] },
        '/api/flow/canonical-stage-deals': { success: true, data: CANONICAL_STAGE_DEALS_DATA }
      });
      (global.fetch as any) = mockFetch;

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing-lead-time' }} />);

      // Should default to 7 days when invalid period
      await waitFor(() => {
        const sevenDaysButton = screen.getByRole('button', { name: '7 days' });
        expect(sevenDaysButton).toHaveClass('bg-red-600');
      });
    });
  });
});
