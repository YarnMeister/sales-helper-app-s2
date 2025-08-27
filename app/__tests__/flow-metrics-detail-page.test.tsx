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

vi.mock('../components/LeadTimeChart', () => ({
  default: ({ deals, metricTitle, canonicalStage }: any) => (
    <div data-testid="lead-time-chart">
      <h3>{metricTitle}</h3>
      <p>Canonical Stage: {canonicalStage}</p>
      <p>Deals Count: {deals?.length || 0}</p>
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the page with correct title and navigation', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0); // Back button and view buttons
    });

    it('shows loading state initially', () => {
      // Mock metric configuration loading
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [{
            id: '1',
            metric_key: 'lead-conversion',
            display_title: 'Lead Conversion Time',
            canonical_stage: 'Lead Conversion',
            is_active: true,
          }],
        }),
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      expect(screen.getByText('Loading deals data...')).toBeInTheDocument();
    });

    it('displays calculated summary statistics correctly', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        // Average: (3 + 12 + 45) / 3 = 20 days (displayed as whole number)
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
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Deal ID')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('End Date')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
      });
    });

    it('renders deal data for lead conversion', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
            ],
          }),
        });

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
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('D001')).toBeInTheDocument();
        expect(screen.getByText('D002')).toBeInTheDocument();
        expect(screen.getByText('D007')).toBeInTheDocument();
      });
    });

    it('highlights best and worst performers', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
            ],
          }),
        });

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
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
            ],
          }),
        });

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
      // Mock metric configuration success, but deals API error
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
        expect(screen.getByText('Failed to fetch metric configuration')).toBeInTheDocument();
      });
    });

    it('handles empty deals data', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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

    it('handles metric not found', async () => {
      // Mock metric not found
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [], // No metrics found
        }),
      });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'non-existent-metric' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Metric not found')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'lead-conversion',
              display_title: 'Lead Conversion Time',
              canonical_stage: 'Lead Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'lead-conversion' }} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const backButton = buttons[0]; // First button is the back button
        fireEvent.click(backButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/flow-metrics-report');
      });
    });
  });

  describe('Custom Metrics', () => {
    it('renders custom metric detail page correctly', async () => {
      // Mock custom metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: 'custom-1',
              metric_key: 'custom-metric',
              display_title: 'Custom Lead Time',
              canonical_stage: 'Custom Stage',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                deal_id: 'C001',
                start_date: '2024-01-15T00:00:00.000Z',
                end_date: '2024-01-20T00:00:00.000Z',
                duration_seconds: 432000, // 5 days
              },
              {
                deal_id: 'C002',
                start_date: '2024-01-16T00:00:00.000Z',
                end_date: '2024-01-25T00:00:00.000Z',
                duration_seconds: 777600, // 9 days
              },
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'custom-metric' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Custom Lead Time')).toBeInTheDocument();
      });

      await waitFor(() => {
        // Expected calculation: (5 + 9) / 2 = 7 days
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('7 days');
        
        const bestCard = screen.getByText('Best Performance').closest('.rounded-lg');
        expect(bestCard).toHaveTextContent('5 days');
        
        const worstCard = screen.getByText('Worst Performance').closest('.rounded-lg');
        expect(worstCard).toHaveTextContent('9 days');
        
        expect(screen.getByText('Based on 2 deals')).toBeInTheDocument();
      });
    });
  });

  describe('Manufacturing Metric Calculation', () => {
    it('calculates correct average for manufacturing metric with test data', async () => {
      // Mock manufacturing metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: 'manufacturing-1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
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
        // Expected calculation: (8*4 + 6*6 + 2*7) / 16 = 82/16 = 5.125 days, rounded to 5
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('5 days');
        
        const bestCard = screen.getByText('Best Performance').closest('.rounded-lg');
        expect(bestCard).toHaveTextContent('4 days');
        
        const worstCard = screen.getByText('Worst Performance').closest('.rounded-lg');
        expect(worstCard).toHaveTextContent('7 days');
        
        expect(screen.getByText('Based on 16 deals')).toBeInTheDocument();
      });
    });
  });

  describe('OEM Order Lead Time', () => {
    it('renders OEM Order Lead Time detail page correctly', async () => {
      // Mock OEM Order Conversion configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: 'oem-1',
              metric_key: 'oem-order-conversion',
              display_title: 'OEM Order Lead Time',
              canonical_stage: 'OEM Order Conversion',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                deal_id: '1467',
                start_date: '2025-08-07T11:16:49.000Z',
                end_date: '2025-08-11T12:28:28.000Z',
                duration_seconds: 349899, // ~4.05 days
              },
              {
                deal_id: '1375',
                start_date: '2025-08-04T10:59:43.000Z',
                end_date: '2025-08-06T05:23:25.000Z',
                duration_seconds: 152622, // ~1.77 days
              },
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'oem-order-conversion' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('OEM Order Lead Time')).toBeInTheDocument();
      });

      await waitFor(() => {
        // Expected calculation: (4.05 + 1.77) / 2 = 2.91 days, rounded to 3
        const averageCard = screen.getByText('Average').closest('.rounded-lg');
        expect(averageCard).toHaveTextContent('3 days');
        
        const bestCard = screen.getByText('Best Performance').closest('.rounded-lg');
        expect(bestCard).toHaveTextContent('2 days');
        
        const worstCard = screen.getByText('Worst Performance').closest('.rounded-lg');
        expect(worstCard).toHaveTextContent('4 days');
        
        expect(screen.getByText('Based on 2 deals')).toBeInTheDocument();
      });
    });
  });

  describe('Chart View Functionality', () => {
    it('should show chart view when Chart View button is clicked', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
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
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Initially should show list view
      expect(screen.getByText('Deal ID')).toBeInTheDocument();
      expect(screen.queryByTestId('lead-time-chart')).not.toBeInTheDocument();

      // Click Chart View button
      const chartViewButton = screen.getByText('Chart View');
      fireEvent.click(chartViewButton);

      // Should now show chart view
      await waitFor(() => {
        expect(screen.getByTestId('lead-time-chart')).toBeInTheDocument();
      });
      expect(screen.getByTestId('lead-time-chart')).toBeInTheDocument();
      const chartElement = screen.getByTestId('lead-time-chart');
      expect(chartElement).toHaveTextContent('Manufacturing Lead Time');
      expect(chartElement).toHaveTextContent('Canonical Stage: Manufacturing');
      expect(chartElement).toHaveTextContent('Deals Count: 2');
    });

    it('should show list view when List View button is clicked', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                deal_id: '1371',
                start_date: '2025-08-14T00:00:00.000Z',
                end_date: '2025-08-18T00:00:00.000Z',
                duration_seconds: 345600, // 4 days
              },
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Switch to chart view first
      const chartViewButton = screen.getByText('Chart View');
      fireEvent.click(chartViewButton);

      await waitFor(() => {
        expect(screen.getByTestId('lead-time-chart')).toBeInTheDocument();
      });

      // Switch back to list view
      const listViewButton = screen.getByText('List View');
      fireEvent.click(listViewButton);

      // Should now show list view
      await waitFor(() => {
        expect(screen.getByText('Deal ID')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('lead-time-chart')).not.toBeInTheDocument();
    });

    it('should handle chart view with no data gracefully', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'empty-metric',
              display_title: 'Empty Metric',
              canonical_stage: 'Empty Stage',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'empty-metric' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Empty Metric')).toBeInTheDocument();
      });

      // Click Chart View button
      const chartViewButton = screen.getByText('Chart View');
      fireEvent.click(chartViewButton);

      // Should show no data message
      await waitFor(() => {
        expect(screen.getByText('No deals found for this canonical stage')).toBeInTheDocument();
      });
    });

    it('should show correct button states for view modes', async () => {
      // Mock metric configuration
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              is_active: true,
            }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                deal_id: '1371',
                start_date: '2025-08-14T00:00:00.000Z',
                end_date: '2025-08-18T00:00:00.000Z',
                duration_seconds: 345600, // 4 days
              },
            ],
          }),
        });

      render(<FlowMetricDetailPage params={{ 'metric-id': 'manufacturing' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Initially List View should be active (default)
      const listViewButton = screen.getByText('List View');
      const chartViewButton = screen.getByText('Chart View');
      
      expect(listViewButton).toHaveClass('bg-rtse-red');
      expect(chartViewButton).toHaveClass('bg-background');

      // Switch to chart view
      fireEvent.click(chartViewButton);

      await waitFor(() => {
        expect(screen.getByTestId('lead-time-chart')).toBeInTheDocument();
      });

      // Now Chart View should be active
      expect(listViewButton).toHaveClass('bg-background');
      expect(chartViewButton).toHaveClass('bg-rtse-red');
    });
  });
});
