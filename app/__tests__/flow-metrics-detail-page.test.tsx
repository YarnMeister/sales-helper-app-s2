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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders the page with correct title for lead conversion', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('renders the common footer', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByTestId('common-footer')).toBeInTheDocument();
    });

    it('has the correct page structure', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      // Check for main sections
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Individual Deal Performance')).toBeInTheDocument();
    });

    it('has content area with correct padding', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      // Find the main content area with the correct padding classes
      const contentArea = screen.getByText('Average').closest('div')?.parentElement?.parentElement?.parentElement;
      expect(contentArea).toHaveClass('px-4', 'py-4', 'pb-24');
    });
  });

  describe('Header Section', () => {
    it('renders the back button', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('renders the correct metric title', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'quote-conversion' }} />);
      
      expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
    });

    it('renders the period text', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('handles back button click', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
    });
  });

  describe('Summary Statistics Cards', () => {
    it('renders all three summary cards', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('Best Performance')).toBeInTheDocument();
      expect(screen.getByText('Worst Performance')).toBeInTheDocument();
    });

    it('displays correct average value for lead conversion', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('17 days')).toBeInTheDocument();
    });

    it('displays correct best value for lead conversion', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const bestElements = screen.getAllByText('3 days');
      expect(bestElements[0]).toBeInTheDocument(); // Summary card element
    });

    it('displays correct worst value for lead conversion', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const worstElements = screen.getAllByText('45 days');
      expect(worstElements[0]).toBeInTheDocument(); // Summary card element
    });

    it('displays correct values for different metrics', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'procurement' }} />);
      
      expect(screen.getByText('44 days')).toBeInTheDocument(); // Average
      const bestElements = screen.getAllByText('10 days');
      expect(bestElements[0]).toBeInTheDocument(); // Best performance card
      const worstElements = screen.getAllByText('90 days');
      expect(worstElements[0]).toBeInTheDocument(); // Worst performance card
    });
  });

  describe('Individual Deal Performance Table', () => {
    it('renders the table with correct title', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Individual Deal Performance')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Deal ID')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('renders deal data for lead conversion', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('D001')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-18')).toBeInTheDocument();
      const threeDaysElements = screen.getAllByText('3 days');
      expect(threeDaysElements[1]).toBeInTheDocument(); // Table row element
    });

    it('renders multiple deals', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('D001')).toBeInTheDocument();
      expect(screen.getByText('D002')).toBeInTheDocument();
      expect(screen.getByText('D004')).toBeInTheDocument();
      expect(screen.getByText('D007')).toBeInTheDocument();
      expect(screen.getByText('D008')).toBeInTheDocument();
    });

    it('highlights best performance deals in green', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const bestDealElements = screen.getAllByText('3 days');
      expect(bestDealElements[1]).toHaveClass('text-green-600'); // Table row element
    });

    it('highlights worst performance deals in red', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const worstDealElements = screen.getAllByText('45 days');
      expect(worstDealElements[1]).toHaveClass('text-red-600'); // Table row element
    });
  });

  describe('Responsive Design', () => {
    it('has responsive grid layout for summary cards', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const gridContainer = screen.getByText('Average').closest('div')?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
    });

    it('has responsive table layout', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      // Find the table container with overflow-x-auto class
      const tableContainer = screen.getByRole('table').closest('div');
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });
  });

  describe('Accessibility', () => {
    it('has proper button elements', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const mainHeading = screen.getByText('Lead Conversion Time');
      expect(mainHeading.tagName).toBe('H1');
    });

    it('has proper table structure', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      const rowgroups = screen.getAllByRole('rowgroup');
      expect(rowgroups).toHaveLength(2); // thead and tbody
    });
  });

  describe('Data Display', () => {
    it('displays correct mock data values for different metrics', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);
      
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      expect(screen.getByText('70 days')).toBeInTheDocument(); // Average
      // Use getAllByText for duplicate values and check the first one (summary card)
      const bestElements = screen.getAllByText('20 days');
      expect(bestElements[0]).toBeInTheDocument(); // Best performance card
      const worstElements = screen.getAllByText('120 days');
      expect(worstElements[0]).toBeInTheDocument(); // Worst performance card
    });

    it('displays all major stages from the design document', () => {
      const metrics = ['lead-conversion', 'quote-conversion', 'order-conversion', 'procurement', 'manufacturing', 'delivery'];
      
      // Test each metric individually to avoid multiple renders
      metrics.forEach(metricId => {
        const { unmount } = render(<FlowMetricDetailPage params={{ 'metric-id': metricId }} />);
        
        // Check that the page renders without error by looking for specific content
        if (metricId === 'lead-conversion') {
          expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
        } else if (metricId === 'quote-conversion') {
          expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
        } else if (metricId === 'order-conversion') {
          expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();
        } else if (metricId === 'procurement') {
          expect(screen.getByText('Procurement Lead Time')).toBeInTheDocument();
        } else if (metricId === 'manufacturing') {
          expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
        } else if (metricId === 'delivery') {
          expect(screen.getByText('Delivery Lead Time')).toBeInTheDocument();
        }
        
        unmount();
      });
    });

    it('handles invalid metric ID gracefully', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'invalid-metric' }} />);
      
      expect(screen.getByText('Metric Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested metric could not be found.')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates back to main flow metrics page', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
    });

    it('maintains correct URL structure', () => {
      render(<FlowMetricDetailPage params={{ 'metric-id': 'delivery' }} />);
      
      expect(screen.getByText('Delivery Lead Time')).toBeInTheDocument();
    });
  });
});
