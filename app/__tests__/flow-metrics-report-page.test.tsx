import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../flow-metrics-report/page';

// Mock the components
vi.mock('../components/CommonHeader', () => ({
  CommonHeader: ({ title }: any) => <div data-testid="common-header">{title}</div>,
}));

vi.mock('../components/CommonFooter', () => ({
  CommonFooter: ({ onNewRequest, isCreating }: any) => (
    <div data-testid="common-footer">
      Common Footer Component
    </div>
  ),
}));

// Mock console.log for testing More Info button clicks
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FlowMetricsReportPage', () => {
  const mockMetricsData = [
    {
      id: 'lead-conversion',
      metric_key: 'lead-conversion',
      display_title: 'Lead Conversion Time',
      canonical_stage: 'Lead Conversion',
      sort_order: 1,
      is_active: true,
      start_stage: 'RFQ Received',
      end_stage: 'Quote Sent',
    },
    {
      id: 'quote-conversion',
      metric_key: 'quote-conversion',
      display_title: 'Quote Conversion Time',
      canonical_stage: 'Quote Conversion',
      sort_order: 2,
      is_active: true,
      start_stage: 'Quote Sent',
      end_stage: 'Order Received',
    },
  ];

  beforeEach(() => {
    mockConsoleLog.mockClear();
    
    // Mock the API call to return metrics data
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockMetricsData
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders the page with correct title', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByTestId('common-header')).toHaveTextContent('Flow Metrics Report');
    });

    it('renders the common footer', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByTestId('common-footer')).toBeInTheDocument();
    });

    it('has the correct page structure', () => {
      render(<FlowMetricsReportPage />);
      
      // Check that the main container has the correct classes
      const mainContainer = screen.getByTestId('common-header').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    it('has content area with correct padding', () => {
      render(<FlowMetricsReportPage />);
      
      // The content area should have the correct padding classes
      const contentArea = screen.getByTestId('common-header').nextElementSibling;
      expect(contentArea).toHaveClass('px-4', 'py-4', 'pb-24');
    });
  });

  describe('Header Section', () => {
    it('renders the Lead Time Overview title', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Track efficiency across your sales pipeline stages')).toBeInTheDocument();
    });

    it('renders the period selector with correct label', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Period:')).toBeInTheDocument();
    });

    it('renders the period dropdown with correct options', () => {
      render(<FlowMetricsReportPage />);
      
      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toBeInTheDocument();
      expect(periodSelect).toHaveValue('7d');
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Last 7 days');
    });

    it('handles period selection change', () => {
      render(<FlowMetricsReportPage />);
      
      const periodSelect = screen.getByRole('combobox');
      fireEvent.change(periodSelect, { target: { value: '7d' } });
      
      expect(periodSelect).toHaveValue('7d');
    });
  });

  describe('KPI Cards Grid', () => {
    it('renders KPI cards from database', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Check that our mock metrics are displayed
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
    });

    it('renders cards in a responsive grid layout', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      const gridContainer = screen.getByText('Lead Conversion Time').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('renders calculating state for metrics', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Check that we show "Calculating..." for metrics (static text, no need to wait)
      const calculatingElements = screen.getAllByText('Calculating...');
      expect(calculatingElements.length).toBeGreaterThan(0);
    });

    it('renders N/A for best/worst metrics initially', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Check that we show "N/A" for best/worst values initially
      const bestNaElements = screen.getAllByText('Best: N/A');
      const worstNaElements = screen.getAllByText('Worst: N/A');
      expect(bestNaElements.length).toBeGreaterThan(0);
      expect(worstNaElements.length).toBeGreaterThan(0);
    });

    it('renders trend indicators for each card', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Check that "Trend" text appears for each card
      const trendTexts = screen.getAllByText('Trend');
      expect(trendTexts.length).toBeGreaterThan(0);
    });

    it('renders trend icons with correct symbols', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Check for trend arrows (↗, ↘, →) - using getAllByText for duplicates
      const stableArrows = screen.getAllByText('→');
      expect(stableArrows.length).toBeGreaterThan(0); // stable trend (default)
    });

    it('renders More Info buttons for each card', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      const moreInfoButtons = screen.getAllByText('More info');
      expect(moreInfoButtons).toHaveLength(2); // Only 2 metrics in our mock data
    });

    it('handles More Info button clicks', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      const moreInfoButtons = screen.getAllByText('More info');
      fireEvent.click(moreInfoButtons[0]); // Click first More Info button
      
      // Check that router.push was called with the correct path
      expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report/lead-conversion');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive header layout', () => {
      render(<FlowMetricsReportPage />);
      
      const headerContainer = screen.getByText('Lead Time Overview').closest('.flex');
      expect(headerContainer).toHaveClass('flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
    });

    it('has responsive grid layout', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      const gridContainer = screen.getByText('Lead Conversion Time').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<FlowMetricsReportPage />);
      
      // Check for period selection elements (mobile select)
      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toBeInTheDocument();
      
      // Check for period buttons (desktop)
      const sevenDaysButton = screen.getByText('7 days');
      expect(sevenDaysButton).toBeInTheDocument();
    });

    it('has proper button elements', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      const moreInfoButtons = screen.getAllByText('More info');
      moreInfoButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('has proper heading hierarchy', () => {
      render(<FlowMetricsReportPage />);
      
      const mainTitle = screen.getByText('Lead Time Overview');
      expect(mainTitle.tagName).toBe('H1');
    });
  });

  describe('Data Display', () => {
    it('displays correct metrics data from API', async () => {
      render(<FlowMetricsReportPage />);
      
      // Wait for the metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      // Verify the metrics are displayed
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(<FlowMetricsReportPage />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Failed to fetch metrics'
        })
      });

      render(<FlowMetricsReportPage />);
      
      // Should show empty state after error
      await waitFor(() => {
        expect(screen.getByText('No active metrics found. Add metrics in the Mappings tab.')).toBeInTheDocument();
      });
    });
  });
});
