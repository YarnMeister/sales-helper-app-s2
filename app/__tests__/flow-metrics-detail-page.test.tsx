import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricDetailPage from '../flow-metrics-report/[metric-id]/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock the components
vi.mock('../components/CommonHeader', () => ({
  CommonHeader: ({ title }: any) => <div data-testid="common-header">{title}</div>,
}));

vi.mock('../components/CommonFooter', () => ({
  CommonFooter: ({ onNewRequest, isCreating }: any) => (
    <div data-testid="common-footer">
      Common Footer
    </div>
  ),
}));

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

describe('FlowMetricDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Mock global.fetch
    global.fetch = vi.fn();
    
    // Mock successful API response for canonical-stage-deals
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            deal_id: 'D001',
            start_date: '2024-01-15T00:00:00.000Z',
            end_date: '2024-01-18T00:00:00.000Z',
            duration_seconds: 259200, // 3 days
          },
          {
            deal_id: 'D002',
            start_date: '2024-01-16T00:00:00.000Z',
            end_date: '2024-01-28T00:00:00.000Z',
            duration_seconds: 1036800, // 12 days
          },
          {
            deal_id: 'D007',
            start_date: '2024-01-05T00:00:00.000Z',
            end_date: '2024-02-19T00:00:00.000Z',
            duration_seconds: 3888000, // 45 days
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the page with correct title and navigation', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument(); // Back button
    });

    it('shows loading state initially', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Loading deals data...')).toBeInTheDocument();
    });

    it('displays calculated summary statistics correctly', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        // Average: (3 + 12 + 45) / 3 = 20 days
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('20 days');
        
        const bestCard = screen.getByText('Best Performance').closest('.rounded-lg');
        expect(bestCard).toHaveTextContent('3 days');
        
        const worstCard = screen.getByText('Worst Performance').closest('.rounded-lg');
        expect(worstCard).toHaveTextContent('45 days');
        
        expect(screen.getByText('Based on 3 deals')).toBeInTheDocument();
      });
    });
  });

  describe('Individual Deal Performance Table', () => {
    it('renders table headers correctly', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deal ID')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('End Date')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
      });
    });

    it('renders deal data for lead conversion', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('D001')).toBeInTheDocument();
        expect(screen.getByText('1/15/2024')).toBeInTheDocument();
        expect(screen.getByText('1/18/2024')).toBeInTheDocument();
        // Check for the table row specifically by looking for the span element
        const tableRow = screen.getByText('D001').closest('tr');
        expect(tableRow).toBeInTheDocument();
        expect(tableRow).toHaveTextContent('3 days');
      });
    });

    it('renders multiple deals', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('D001')).toBeInTheDocument();
        expect(screen.getByText('D002')).toBeInTheDocument();
        expect(screen.getByText('D007')).toBeInTheDocument();
      });
    });

    it('highlights best and worst performers', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        // Best performer (3 days) should have green styling
        const bestDeal = screen.getByText('D001').closest('tr');
        expect(bestDeal).toHaveClass('bg-green-50');
        
        // Worst performer (45 days) should have red styling
        const worstDeal = screen.getByText('D007').closest('tr');
        expect(worstDeal).toHaveClass('bg-red-50');
      });
    });
  });

  describe('Responsive Design', () => {
    it('has responsive table layout', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        // Find the table container with overflow-x-auto class
        const tableContainer = screen.getByRole('table').closest('div');
        expect(tableContainer).toHaveClass('overflow-x-auto');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        const rowgroups = screen.getAllByRole('rowgroup');
        expect(rowgroups).toHaveLength(2); // thead and tbody
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to fetch deals data',
        }),
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch deals data')).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch deals data')).toBeInTheDocument();
      });
    });

    it('handles empty deals data', async () => {
      // Mock empty response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('0 days');
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', async () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        const backButton = screen.getByRole('button');
        fireEvent.click(backButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
      });
    });
  });

  describe('Invalid Metric', () => {
    it('shows error for invalid metric ID', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'invalid-metric' }} />);
      
      expect(screen.getByText('Metric Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested metric could not be found.')).toBeInTheDocument();
    });
  });

  describe('Manufacturing Metric Calculation', () => {
    it('calculates correct average for manufacturing metric with test data', async () => {
      // Mock manufacturing data with the test scenario
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            // 8 deals with 4 days each
            ...Array.from({ length: 8 }, (_, i) => ({
              deal_id: `M${i + 1}`,
              start_date: '2024-01-15T00:00:00.000Z',
              end_date: '2024-01-19T00:00:00.000Z',
              duration_seconds: 345600, // 4 days
            })),
            // 6 deals with 6 days each
            ...Array.from({ length: 6 }, (_, i) => ({
              deal_id: `N${i + 1}`,
              start_date: '2024-01-15T00:00:00.000Z',
              end_date: '2024-01-21T00:00:00.000Z',
              duration_seconds: 518400, // 6 days
            })),
            // 2 deals with 7 days each
            ...Array.from({ length: 2 }, (_, i) => ({
              deal_id: `O${i + 1}`,
              start_date: '2024-01-15T00:00:00.000Z',
              end_date: '2024-01-22T00:00:00.000Z',
              duration_seconds: 604800, // 7 days
            })),
          ],
        }),
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);
      
      await waitFor(() => {
        // Expected calculation: (8*4 + 6*6 + 2*7) / 16 = 82/16 = 5.125 days
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('5.13 days');
        
        const bestCard = screen.getByText('Best Performance').closest('.rounded-lg');
        expect(bestCard).toHaveTextContent('4 days');
        
        const worstCard = screen.getByText('Worst Performance').closest('.rounded-lg');
        expect(worstCard).toHaveTextContent('7 days');
        
        expect(screen.getByText('Based on 16 deals')).toBeInTheDocument();
      });
    });
  });
});
