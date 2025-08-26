import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ViewToggle } from '../../app/components/ViewToggle';
import { DealInputForm } from '../../app/components/DealInputForm';
import { FlowDataTable } from '../../app/components/FlowDataTable';
import { MetricsManagement } from '../../app/components/MetricsManagement';

// Mock fetch
global.fetch = vi.fn();

// Mock useToast hook
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Flow Metrics UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ViewToggle', () => {
    it('should render all three view options', () => {
      const mockOnViewChange = vi.fn();
      
      render(
        <ViewToggle 
          currentView="metrics" 
          onViewChange={mockOnViewChange} 
        />
      );

      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
      expect(screen.getByText('Mappings')).toBeInTheDocument();
    });

    it('should highlight the current view', () => {
      const mockOnViewChange = vi.fn();
      
      render(
        <ViewToggle 
          currentView="raw-data" 
          onViewChange={mockOnViewChange} 
        />
      );

      const rawDataButton = screen.getByText('Raw Data').closest('button');
      expect(rawDataButton).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white', 'shadow-sm');
    });

    it('should call onViewChange when buttons are clicked', () => {
      const mockOnViewChange = vi.fn();
      
      render(
        <ViewToggle 
          currentView="metrics" 
          onViewChange={mockOnViewChange} 
        />
      );

      fireEvent.click(screen.getByText('Raw Data'));
      expect(mockOnViewChange).toHaveBeenCalledWith('raw-data');

      fireEvent.click(screen.getByText('Mappings'));
      expect(mockOnViewChange).toHaveBeenCalledWith('mappings');
    });
  });

  describe('DealInputForm', () => {
    it('should render input field and fetch button', () => {
      const mockOnFetchSuccess = vi.fn();
      
      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeInTheDocument();
    });

    it('should handle deal ID input and fetch', async () => {
      const mockOnFetchSuccess = vi.fn();
      const mockFetchResponse = {
        success: true,
        data: [
          {
            id: '1',
            deal_id: 1467,
            stage_name: 'Quality Control',
            entered_at: '2025-08-11T12:28:28.000Z'
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFetchResponse
      });

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(mockOnFetchSuccess).toHaveBeenCalledWith(mockFetchResponse.data);
      });
    });

    it('should show loading state when fetching', () => {
      const mockOnFetchSuccess = vi.fn();
      
      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={true}
        />
      );

      expect(screen.getByText('Fetch')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeDisabled();
    });

    it('should handle fetch errors', async () => {
      const mockOnFetchSuccess = vi.fn();
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(mockOnFetchSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('FlowDataTable', () => {
    const mockData = [
      {
        id: '1',
        pipedrive_event_id: 12345,
        deal_id: 1467,
        pipeline_id: 1,
        stage_id: 1,
        stage_name: 'Quality Control',
        entered_at: '2025-08-11T12:28:28.000Z',
        left_at: undefined,
        duration_seconds: undefined,
        created_at: '2025-08-11T12:28:28.000Z',
        updated_at: '2025-08-11T12:28:28.000Z'
      },
      {
        id: '2',
        pipedrive_event_id: 12346,
        deal_id: 1467,
        pipeline_id: 1,
        stage_id: 2,
        stage_name: 'Order Ready',
        entered_at: '2025-08-12T10:15:00.000Z',
        left_at: '2025-08-12T14:30:00.000Z',
        duration_seconds: 15300,
        created_at: '2025-08-12T10:15:00.000Z',
        updated_at: '2025-08-12T14:30:00.000Z'
      }
    ];

    it('should render table with data', () => {
      render(
        <FlowDataTable 
          data={mockData}
          isLoading={false}
        />
      );

      expect(screen.getByText('Quality Control')).toBeInTheDocument();
      expect(screen.getByText('Order Ready')).toBeInTheDocument();
      expect(screen.getAllByText('1467')).toHaveLength(2);
    });

    it('should show loading state', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
        />
      );

      expect(screen.getByText('No flow data available. Fetch a deal to see data here.')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(
        <FlowDataTable 
          data={mockData}
          isLoading={false}
        />
      );

      // Check that dates are formatted
      expect(screen.getByText(/8\/11\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/8\/12\/2025/)).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const dataWithNulls = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 1,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: undefined,
          duration_seconds: undefined,
          created_at: '2025-08-11T12:28:28.000Z',
          updated_at: '2025-08-11T12:28:28.000Z'
        }
      ];

      render(
        <FlowDataTable 
          data={dataWithNulls}
          isLoading={false}
        />
      );

      expect(screen.getByText('1467')).toBeInTheDocument();
      expect(screen.getByText('Quality Control')).toBeInTheDocument();
      // Should handle null left_at and duration_seconds
    });
  });

  describe('MetricsManagement', () => {
    it('should render metrics table', async () => {
      const mockMetrics = [
        {
          id: '1',
          metric_key: 'lead-conversion-time',
          display_title: 'Lead Conversion Time',
          canonical_stage: 'LEAD',
          sort_order: 1,
          is_active: true,
          start_stage: 'RFQ Received',
          end_stage: 'Quote Sent',
          created_at: '2025-08-11T12:28:28.000Z',
          updated_at: '2025-08-11T12:28:28.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMetrics })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
        expect(screen.getByText('lead-conversion-time')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MetricsManagement />);

      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('should show empty state when no metrics', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      });
    });

    it('should handle edit mode', async () => {
      const mockMetrics = [
        {
          id: '1',
          metric_key: 'lead-conversion-time',
          display_title: 'Lead Conversion Time',
          canonical_stage: 'LEAD',
          sort_order: 1,
          is_active: true,
          start_stage: 'RFQ Received',
          end_stage: 'Quote Sent',
          created_at: '2025-08-11T12:28:28.000Z',
          updated_at: '2025-08-11T12:28:28.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMetrics })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lead Conversion Time')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Lead Conversion Time')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('should handle add new metric', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Add New Metric')).toBeInTheDocument();
      });

      // Click the button (not the header)
      const addButton = screen.getByRole('button', { name: 'Add New Metric' });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., lead-conversion')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      });
    });
  });
});
