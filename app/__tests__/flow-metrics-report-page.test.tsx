import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FlowMetricsReportPage from '../flow-metrics-report/page';

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
      Common Footer Component
    </div>
  ),
}));

// Mock console.log for testing More Info button clicks
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('FlowMetricsReportPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    mockConsoleLog.mockClear();
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
    it('renders all 6 KPI cards', () => {
      render(<FlowMetricsReportPage />);
      
      // Check all card titles are present
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Procurement Lead Time')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      expect(screen.getByText('Delivery Lead Time')).toBeInTheDocument();
    });

    it('renders cards in a responsive grid layout', () => {
      render(<FlowMetricsReportPage />);
      
      const gridContainer = screen.getByText('Lead Conversion Time').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('renders correct main metrics for each card', () => {
      render(<FlowMetricsReportPage />);
      
      // Check that all main metrics are present (using getAllByText for duplicates)
      const eightDaysElements = screen.getAllByText('8 days');
      expect(eightDaysElements).toHaveLength(2); // Lead Conversion and Quote Conversion
      
      expect(screen.getByText('15 days')).toBeInTheDocument(); // Order Conversion
      expect(screen.getByText('22 days')).toBeInTheDocument(); // Procurement
      expect(screen.getByText('35 days')).toBeInTheDocument(); // Manufacturing
      expect(screen.getByText('7 days')).toBeInTheDocument(); // Delivery
    });

    it('renders best/worst metrics for each card', () => {
      render(<FlowMetricsReportPage />);
      
      // Check for best values (green)
      expect(screen.getByText('Best: 3d')).toBeInTheDocument();
      expect(screen.getByText('Best: 8d')).toBeInTheDocument();
      expect(screen.getByText('Best: 5d')).toBeInTheDocument();
      expect(screen.getByText('Best: 10d')).toBeInTheDocument();
      expect(screen.getByText('Best: 20d')).toBeInTheDocument();
      expect(screen.getByText('Best: 2d')).toBeInTheDocument();
      
      // Check for worst values (red)
      expect(screen.getByText('Worst: 12d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 8d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 60d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 90d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 120d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 21d')).toBeInTheDocument();
    });

    it('renders trend indicators for each card', () => {
      render(<FlowMetricsReportPage />);
      
      // Check that "Trend" text appears 6 times (once per card)
      const trendTexts = screen.getAllByText('Trend');
      expect(trendTexts).toHaveLength(6);
    });

    it('renders trend icons with correct symbols', () => {
      render(<FlowMetricsReportPage />);
      
      // Check for trend arrows (↗, ↘, →) - using getAllByText for duplicates
      const upArrows = screen.getAllByText('↗');
      expect(upArrows.length).toBeGreaterThan(0); // up trend
      
      const downArrows = screen.getAllByText('↘');
      expect(downArrows.length).toBeGreaterThan(0); // down trend
      
      const stableArrows = screen.getAllByText('→');
      expect(stableArrows.length).toBeGreaterThan(0); // stable trend
    });

    it('renders More Info buttons for each card', () => {
      render(<FlowMetricsReportPage />);
      
      const moreInfoButtons = screen.getAllByText('More info');
      expect(moreInfoButtons).toHaveLength(6);
    });

    it('handles More Info button clicks', () => {
      render(<FlowMetricsReportPage />);
      
      const moreInfoButtons = screen.getAllByText('More info');
      fireEvent.click(moreInfoButtons[0]); // Click first More Info button
      
      expect(mockConsoleLog).toHaveBeenCalledWith('More info clicked for:', 'Lead Conversion Time');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive header layout', () => {
      render(<FlowMetricsReportPage />);
      
      const headerContainer = screen.getByText('Lead Time Overview').closest('.flex');
      expect(headerContainer).toHaveClass('flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
    });

    it('has responsive grid layout', () => {
      render(<FlowMetricsReportPage />);
      
      const gridContainer = screen.getByText('Lead Conversion Time').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<FlowMetricsReportPage />);
      
      const periodLabel = screen.getByText('Period:');
      const periodSelect = screen.getByRole('combobox');
      expect(periodLabel).toBeInTheDocument();
      expect(periodSelect).toHaveAttribute('id', 'period-select');
    });

    it('has proper button elements', () => {
      render(<FlowMetricsReportPage />);
      
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
    it('displays correct mock data values', () => {
      render(<FlowMetricsReportPage />);
      
      // Verify specific data points from mock data
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      const eightDaysElements = screen.getAllByText('8 days');
      expect(eightDaysElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Best: 3d')).toBeInTheDocument();
      expect(screen.getByText('Worst: 12d')).toBeInTheDocument();
    });

    it('displays all major stages from the design document', () => {
      render(<FlowMetricsReportPage />);
      
      // These should match the major stages mentioned in the design document
      expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Quote Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Order Conversion Time')).toBeInTheDocument();
      expect(screen.getByText('Procurement Lead Time')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      expect(screen.getByText('Delivery Lead Time')).toBeInTheDocument();
    });
  });
});
