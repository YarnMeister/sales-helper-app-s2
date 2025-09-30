import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../../pages/page';

// Mock the components
vi.mock('../../../../components/CommonHeader', () => ({
  CommonHeader: ({ currentPage }: any) => <div data-testid="common-header">{currentPage}</div>,
}));

vi.mock('../../../../components/CommonFooter', () => ({
  CommonFooter: ({ onNewRequest, isCreating }: any) => (
    <div data-testid="common-footer">
      Common Footer Component
    </div>
  ),
}));

// Mock console.log for testing More Info button clicks
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Using global.fetch mock from tests/setup.ts

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

    // Configure the global fetch mock (Level 1) with test-specific behavior
    (global.fetch as any).mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input?.toString?.() || '';

      if (url.startsWith('/api/flow/metrics')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [
              { id: 'lead-conversion', title: 'Lead Conversion Time', mainMetric: '5.2', totalDeals: 12 },
              { id: 'quote-conversion', title: 'Quote Conversion Time', mainMetric: '3.8', totalDeals: 9 },
            ],
          }),
        } as any);
      }

      if (url.startsWith('/api/pipedrive/deal-flow-data')) {
        return Promise.resolve({
          json: async () => ({ success: true, data: [] }),
        } as any);
      }

      return Promise.resolve({
        json: async () => ({ success: true, data: [] }),
      } as any);
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
      expect(contentArea).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'py-8');
    });
  });

  describe('Header Section', () => {
    it('renders the Flow Metrics Report title', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Flow Metrics Report')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Track and analyze your sales process efficiency')).toBeInTheDocument();
    });

    it('renders the period selector', () => {
      render(<FlowMetricsReportPage />);

      expect(screen.getAllByText('7 days').length).toBeGreaterThan(0);
    });

    it('renders the period dropdown with correct options', () => {
      render(<FlowMetricsReportPage />);

      const periodSelect = screen.getByRole('combobox');
      expect(periodSelect).toBeInTheDocument();
      expect(periodSelect).toHaveValue('7d');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('7 days');
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

    it('shows loading state then renders metrics', async () => {
      render(<FlowMetricsReportPage />);

      // Initially shows loading placeholder
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();

      // Then renders metrics
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
    });

    it('renders deal counts on KPI cards', async () => {
      render(<FlowMetricsReportPage />);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });

      // Check that we show deal counts for each metric
      expect(screen.getByText('Based on 12 deals')).toBeInTheDocument();
      expect(screen.getByText('Based on 9 deals')).toBeInTheDocument();
    });

    it('renders metric values for each card', async () => {
      render(<FlowMetricsReportPage />);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });

      expect(screen.getByText('5.2 days')).toBeInTheDocument();
      expect(screen.getByText('3.8 days')).toBeInTheDocument();
    });

    it('renders deal counts on cards', async () => {
      render(<FlowMetricsReportPage />);

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });

      expect(screen.getByText('Based on 12 deals')).toBeInTheDocument();
      expect(screen.getByText('Based on 9 deals')).toBeInTheDocument();
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

      // Check that router.push was called with the correct path (includes selected period)
      const router = useRouter();
      expect(router.push).toHaveBeenCalledWith('/flow-metrics-report/lead-conversion?period=7d');
    });
  });

  describe('Responsive Design', () => {
    it('renders header title with correct styling', () => {
      render(<FlowMetricsReportPage />);

      const headerTitle = screen.getByText('Lead Time Overview');
      expect(headerTitle).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
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

      // Check for period buttons (desktop) by role and accessible name
      const sevenDayButtons = screen.getAllByRole('button', { name: '7 days' });
      expect(sevenDayButtons.length).toBeGreaterThan(0);
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
      // Mock API error for metrics endpoint
      (global.fetch as any).mockImplementationOnce((input: any) => {
        const url = typeof input === 'string' ? input : input?.toString?.() || '';
        if (url.startsWith('/api/flow/metrics')) {
          return Promise.resolve({
            json: async () => ({ success: false, error: 'Failed to fetch metrics' })
          } as any);
        }
        return Promise.resolve({ json: async () => ({ success: true, data: [] }) } as any);
      });

      render(<FlowMetricsReportPage />);

      // Should show empty state after error
      await waitFor(() => {
        expect(screen.getByText('No active metrics found. Add metrics in the Mappings tab.')).toBeInTheDocument();
      });
    });
  });
});
