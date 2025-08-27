import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadTimeChart from '../../app/components/LeadTimeChart';

// Mock the ComboChart component
vi.mock('../../app/components/ComboChart', () => ({
  ComboChart: ({ data, barSeries, lineSeries, showLegend, showTooltip, showXAxis, showGridLines, tickGap, yAxisDomain, className }: any) => (
    <div data-testid="combo-chart" className={className}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="bar-series">{JSON.stringify(barSeries)}</div>
      <div data-testid="line-series">{JSON.stringify(lineSeries)}</div>
      <div data-testid="chart-props">
        showLegend: {showLegend.toString()}, 
        showTooltip: {showTooltip.toString()}, 
        showXAxis: {showXAxis.toString()}, 
        showGridLines: {showGridLines.toString()}, 
        tickGap: {tickGap}, 
        yAxisDomain: {yAxisDomain ? `[${yAxisDomain[0]}, ${yAxisDomain[1]}]` : 'undefined'}
      </div>
    </div>
  ),
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
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();

      // Check that the computed average is displayed
      expect(screen.getByText('Average (computed): 5.3 days')).toBeInTheDocument();

      // Check that the toggle checkbox is present
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Use computed average instead of 5')).toBeInTheDocument();

      // Check that the ComboChart is rendered
      expect(screen.getByTestId('combo-chart')).toBeInTheDocument();

      // Check chart data
      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      expect(chartData).toHaveLength(4);
      expect(chartData[0]).toEqual({
        index: '#1371',
        Days: 4,
        Average: 5,
      });

      // Check bar series configuration
      const barSeries = JSON.parse(screen.getByTestId('bar-series').textContent || '{}');
      expect(barSeries).toEqual({
        categories: ['Days'],
        colors: ['skyblue'],
        yAxisWidth: 60,
        yAxisLabel: 'Duration (days)',
        showYAxis: true,
        allowDecimals: false,
      });

      // Check line series configuration
      const lineSeries = JSON.parse(screen.getByTestId('line-series').textContent || '{}');
      expect(lineSeries).toEqual({
        categories: ['Average'],
        colors: ['orange'],
        yAxisLabel: 'Average (days)',
        showYAxis: false,
      });

      // Check chart props
      expect(screen.getByTestId('chart-props')).toHaveTextContent(
        'showLegend: true, showTooltip: true, showXAxis: true, showGridLines: true, tickGap: 2'
      );

      // Check footer information
      const totalDealsElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Total deals: 4');
      });
      expect(totalDealsElements.length).toBeGreaterThan(0);
      
      const canonicalStageElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Canonical stage: Manufacturing');
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
      
      // Check the chart data shows constant average
      let chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      expect(chartData[0].Average).toBe(5);

      // Check the checkbox
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Now should use computed average
      await waitFor(() => {
        const updatedChartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
        expect(updatedChartData[0].Average).toBe(5.3);
      });
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
      expect(screen.queryByTestId('combo-chart')).not.toBeInTheDocument();
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
      expect(screen.queryByTestId('combo-chart')).not.toBeInTheDocument();
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
      expect(screen.queryByTestId('combo-chart')).not.toBeInTheDocument();
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
        return element?.textContent?.includes('Total deals: 1');
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
    it('should format deal indices correctly', () => {
      render(
        <LeadTimeChart
          deals={mockDeals}
          metricTitle="Test Metric"
          canonicalStage="Test Stage"
        />
      );

      const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '[]');
      
      expect(chartData[0].index).toBe('#1371');
      expect(chartData[1].index).toBe('#1388');
      expect(chartData[2].index).toBe('#1205');
      expect(chartData[3].index).toBe('#1357');
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
      
      expect(chartData[0].Days).toBe(4); // 345600 seconds = 4 days
      expect(chartData[1].Days).toBe(4); // 345600 seconds = 4 days
      expect(chartData[2].Days).toBe(6); // 518400 seconds = 6 days
      expect(chartData[3].Days).toBe(7); // 604800 seconds = 7 days
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
});
