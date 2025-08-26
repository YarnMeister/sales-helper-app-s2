import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock useToast hook with stable reference - must be at top level
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

import { ViewToggle } from '../../app/components/ViewToggle';
import { DealInputForm } from '../../app/components/DealInputForm';
import { FlowDataTable } from '../../app/components/FlowDataTable';
import { MetricsManagement } from '../../app/components/MetricsManagement';
import { 
  TEST_TIMEOUT, 
  createMockFetch, 
  MANUFACTURING_LEAD_TIME_METRIC,
  MANUFACTURING_FLOW_DATA,
  CANONICAL_STAGE_DEALS_DATA,
  setupFlowMetricsTest,
  cleanupFlowMetricsTest
} from '../test-utils';

describe('Flow Metrics UI Components', () => {
  beforeEach(() => {
    setupFlowMetricsTest();
  });

  afterEach(() => {
    cleanupFlowMetricsTest();
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
        data: MANUFACTURING_FLOW_DATA
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

    it('should show loading state', () => {
      const mockOnFetchSuccess = vi.fn();
      
      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={true}
        />
      );

      // When isLoading is true, the button should be disabled but still show "Fetch"
      expect(screen.getByText('Fetch')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeDisabled();
    });
  });

  describe('FlowDataTable', () => {
    it('should render table with data', () => {
      render(
        <FlowDataTable 
          data={MANUFACTURING_FLOW_DATA}
          isLoading={false}
        />
      );

      expect(screen.getByText('Quality Control')).toBeInTheDocument();
      expect(screen.getByText('Order Inv Paid')).toBeInTheDocument();
      expect(screen.getAllByText('1467')).toHaveLength(2);
    });

    it('should display Stage ID column', () => {
      render(
        <FlowDataTable 
          data={MANUFACTURING_FLOW_DATA}
          isLoading={false}
        />
      );

      // Check that Stage ID column header is present
      expect(screen.getByText('Stage ID')).toBeInTheDocument();
      
      // Check that stage IDs are displayed
      expect(screen.getByText('5')).toBeInTheDocument(); // stage_id: 5
      expect(screen.getByText('8')).toBeInTheDocument(); // stage_id: 8
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

    it('should format dates correctly in dd-mm-yyyy format', () => {
      render(
        <FlowDataTable 
          data={MANUFACTURING_FLOW_DATA}
          isLoading={false}
        />
      );

      // Check that dates are formatted in dd-mm-yyyy format
      expect(screen.getByText('11-08-2025')).toBeInTheDocument();
      expect(screen.getByText('12-08-2025')).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const dataWithNulls = [
        {
          id: '1',
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 5,
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
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
        expect(screen.getByText('manufacturing-lead-time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<MetricsManagement />);

      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('should show empty state when no metrics', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should handle edit mode for Manufacturing Lead Time (cornerstone test)', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Find and click the Edit button for the Manufacturing Lead Time metric
      const editButtons = screen.getAllByText('Edit');
      const manufacturingEditButton = editButtons[0]; // First metric
      fireEvent.click(manufacturingEditButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Manufacturing Lead Time')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Start Stage ID
        expect(screen.getByDisplayValue('8')).toBeInTheDocument(); // End Stage ID
        expect(screen.getByText('Save')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should handle save functionality for Manufacturing Lead Time', async () => {
      const mockMetrics = [MANUFACTURING_LEAD_TIME_METRIC];

      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: mockMetrics },
        '/api/pipedrive/pipelines': { success: true, data: [] },
        [`/api/admin/flow-metrics-config/${MANUFACTURING_LEAD_TIME_METRIC.id}`]: { 
          success: true, 
          data: { ...MANUFACTURING_LEAD_TIME_METRIC, display_title: 'Updated Manufacturing Lead Time' }
        }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Click Edit
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Update the display title
      const titleInput = screen.getByDisplayValue('Manufacturing Lead Time');
      fireEvent.change(titleInput, { target: { value: 'Updated Manufacturing Lead Time' } });

      // Click Save
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Updated Manufacturing Lead Time')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should handle add new metric', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': { success: true, data: [] },
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Add New Metric')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });

      // Click the Add New Metric button
      const addButton = screen.getByRole('button', { name: 'Add New Metric' });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., lead-conversion')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = createMockFetch({
        '/api/admin/flow-metrics-config': Promise.reject(new Error('Network error')),
        '/api/pipedrive/pipelines': { success: true, data: [] }
      });

      (global.fetch as any) = mockFetch;

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });
  });
});
