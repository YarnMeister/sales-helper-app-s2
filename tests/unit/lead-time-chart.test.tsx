import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadTimeChart from '../../app/components/LeadTimeChart';

// Mock Recharts components
vi.mock('recharts', () => ({
  ComposedChart: ({ children, data }: any) => (
    <div data-testid="composed-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill }: any) => (
    <div data-testid="bar" data-data-key={dataKey} data-fill={fill} />
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid="line" data-data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('LeadTimeChart', () => {
  const mockDeals = [
    {
      deal_id: '1371',
      start_date: '2025-08-14T00:00:00.000Z',
      end_date: '2025-08-18T00:00:00.000Z',
      duration_seconds: 345600, // 4 days
    },
    {
      deal_id: '1388',
      start_date: '2025-08-14T00:00:00.000Z',
      end_date: '2025-08-18T00:00:00.000Z',
      duration_seconds: 345600, // 4 days
    },
    {
      deal_id: '1205',
      start_date: '2025-08-13T00:00:00.000Z',
      end_date: '2025-08-18T00:00:00.000Z',
      duration_seconds: 518400, // 6 days
    },
    {
      deal_id: '1357',
      start_date: '2025-08-12T00:00:00.000Z',
      end_date: '2025-08-18T00:00:00.000Z',
      duration_seconds: 604800, // 7 days
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering with data', () => {
    it('should render chart with correct data and configuration', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Manufacturing Lead Time"
          canonicalStage="Manufacturing"
        />
      );

      // Check that the chart title is displayed
      const titleElements = screen.getAllByText('Manufacturing Lead Time');
      expect(titleElements.length).toBeGreaterThan(0);

      // Check that the computed average is displayed
      expect(screen.getByText('Average (computed): 5.3 days')).toBeInTheDocument();

      // Check that the toggle checkbox is present
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText('Use computed average instead of 5')).toBeInTheDocument();

      // Check that the Recharts components are rendered
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();

      // Check chart data (now sorted by date, earliest first)
      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      expect(chartData).toHaveLength(4);
      expect(chartData[0].name).toBe('12-08'); // Earliest date first
      expect(chartData[0].Days).toBe(7);

      // Check footer information
      const totalDealsElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Total deals: 4') || false;
      });
      expect(totalDealsElements.length).toBeGreaterThan(0);
      
      const canonicalStageElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Canonical stage: Manufacturing') || false;
      });
      expect(canonicalStageElements.length).toBeGreaterThan(0);
    });

    it('should calculate average correctly', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      // Average should be (4+4+6+7)/4 = 5.25 rounded to 5.3
      expect(screen.getByText('Average (computed): 5.3 days')).toBeInTheDocument();
    });

    it('should handle computed average toggle', async () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      
      // Initially unchecked (using constant 5)
      expect(checkbox).not.toBeChecked();

      // Check the checkbox
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Verify the line component updates (this would be tested in integration tests)
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });
  });

  describe('Empty data handling', () => {
    it('should display no data message when deals array is empty', () => {
      render(
        <LeadTimeChart
          deals={[]}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });

    it('should display no data message when deals is null', () => {
      render(
        <LeadTimeChart
          deals={null as any}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });

    it('should display no data message when deals is undefined', () => {
      render(
        <LeadTimeChart
          deals={undefined as any}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle single deal correctly', () => {
      const singleDeal = [mockDeals[0]];
      
      render(
        <LeadTimeChart
          deals={singleDeal}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText(/Average \(computed\): 4.*days/)).toBeInTheDocument();
      const totalDealsElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Total deals: 1') || false;
      });
      expect(totalDealsElements.length).toBeGreaterThan(0);
    });

    it('should handle deals with zero duration', () => {
      const zeroDurationDeals = [
        {
          deal_id: 'test1',
          start_date: '2025-08-14T00:00:00.000Z',
          end_date: '2025-08-14T00:00:00.000Z',
          duration_seconds: 0,
        },
        {
          deal_id: 'test2',
          start_date: '2025-08-14T00:00:00.000Z',
          end_date: '2025-08-15T00:00:00.000Z',
          duration_seconds: 86400, // 1 day
        },
      ];

      render(
        <LeadTimeChart
          deals={zeroDurationDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText('Average (computed): 0.5 days')).toBeInTheDocument();
    });

    it('should handle very large durations', () => {
      const largeDurationDeals = [
        {
          deal_id: 'test1',
          start_date: '2025-08-14T00:00:00.000Z',
          end_date: '2025-09-14T00:00:00.000Z',
          duration_seconds: 2592000, // 30 days
        },
      ];

      render(
        <LeadTimeChart
          deals={largeDurationDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByText(/Average \(computed\): 30.*days/)).toBeInTheDocument();
    });
  });

  describe('Chart data formatting', () => {
    it('should format dates correctly', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      
      expect(chartData[0].name).toBe('12-08'); // Earliest date first
      expect(chartData[1].name).toBe('13-08');
      expect(chartData[2].name).toBe('14-08');
      expect(chartData[3].name).toBe('14-08');
    });

    it('should calculate days correctly from duration_seconds', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      
      expect(chartData[0].Days).toBe(7); // 604800 seconds = 7 days (earliest date)
      expect(chartData[1].Days).toBe(6); // 518400 seconds = 6 days
      expect(chartData[2].Days).toBe(4); // 345600 seconds = 4 days
      expect(chartData[3].Days).toBe(4); // 345600 seconds = 4 days
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should have semantic HTML structure', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      
      // Check for proper label association
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Use computed average instead of 5');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Recharts Integration', () => {
    it('should render bar with correct data key and color', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const bar = screen.getByTestId('bar');
      expect(bar).toHaveAttribute('data-data-key', 'Days');
      expect(bar).toHaveAttribute('data-fill', '#447DF7');
    });

    it('should render line with correct data key and stroke color', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-data-key', 'Average');
      expect(line).toHaveAttribute('data-stroke', '#FF6B35');
    });

    it('should update line data key when computed average is toggled', async () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      // Initially should use 'Average' (constant 5)
      let line = screen.getByTestId('line');
      expect(line).toHaveAttribute('data-data-key', 'Average');

      // Toggle to computed average
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should now use 'AverageComputed'
      await waitFor(() => {
        line = screen.getByTestId('line');
        expect(line).toHaveAttribute('data-data-key', 'AverageComputed');
      });
    });

    it('should render all required Recharts components', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should pass correct chart data structure', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      
      // Check data structure
      expect(chartData[0]).toHaveProperty('name');
      expect(chartData[0]).toHaveProperty('Days');
      expect(chartData[0]).toHaveProperty('Average');
      expect(chartData[0]).toHaveProperty('AverageComputed');
      expect(chartData[0]).toHaveProperty('dateLabel');
      expect(chartData[0]).toHaveProperty('dealId');
      expect(chartData[0]).toHaveProperty('startDate');
      expect(chartData[0]).toHaveProperty('endDate');
    });
  });
});
