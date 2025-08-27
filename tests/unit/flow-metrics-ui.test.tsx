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
        expect(mockOnFetchSuccess).toHaveBeenCalledWith(mockFetchResponse.data, 1467);
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
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      render(
        <FlowDataTable 
          data={dataWithNulls}
          isLoading={false}
        />
      );

      // Should render without errors
      expect(screen.getByText('Quality Control')).toBeInTheDocument();
      expect(screen.getByText('1467')).toBeInTheDocument();
    });

    it('should show pagination controls when dealId is provided and data is empty initially', async () => {
      // Mock the paginated API response
      const mockPaginationResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockPaginationResponse
      });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
        />
      );

      // Wait for the component to load paginated data
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 100 stage transitions')).toBeInTheDocument();
      });

      // Check that pagination controls are shown
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    it('should show Load All Data button when using pagination', async () => {
      const mockPaginationResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockPaginationResponse
      });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Load All Data')).toBeInTheDocument();
      });
    });

    it('should handle pagination navigation', async () => {
      const mockFirstPageResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      const mockSecondPageResponse = {
        success: true,
        data: [
          {
            id: '3',
            deal_id: 1467,
            pipeline_id: 1,
            stage_id: 10,
            stage_name: 'Final Stage',
            entered_at: '2025-08-13T12:28:28.000Z',
            left_at: null,
            duration_seconds: null,
            created_at: '2025-08-25T13:33:46.718Z',
            updated_at: '2025-08-25T13:33:46.718Z'
          }
        ],
        pagination: {
          page: 2,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: false,
          hasPrevPage: true
        }
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          json: async () => mockFirstPageResponse
        })
        .mockResolvedValueOnce({
          json: async () => mockSecondPageResponse
        });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
      });

      // Click Next button
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Wait for second page to load
      await waitFor(() => {
        expect(screen.getByText('Final Stage')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      });
    });

    it('should handle Load All Data functionality', async () => {
      const mockPaginationResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      const mockAllDataResponse = {
        success: true,
        data: [
          ...MANUFACTURING_FLOW_DATA,
          {
            id: '3',
            deal_id: 1467,
            pipeline_id: 1,
            stage_id: 10,
            stage_name: 'Final Stage',
            entered_at: '2025-08-13T12:28:28.000Z',
            left_at: null,
            duration_seconds: null,
            created_at: '2025-08-25T13:33:46.718Z',
            updated_at: '2025-08-25T13:33:46.718Z'
          }
        ]
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          json: async () => mockPaginationResponse
        })
        .mockResolvedValueOnce({
          json: async () => mockAllDataResponse
        });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Load All Data')).toBeInTheDocument();
      });

      // Click Load All Data button
      const loadAllButton = screen.getByText('Load All Data');
      fireEvent.click(loadAllButton);

      // Wait for all data to load
      await waitFor(() => {
        expect(screen.getByText('Final Stage')).toBeInTheDocument();
        expect(screen.getByText('Showing 3 stage transitions')).toBeInTheDocument();
      });

      // Pagination controls should be hidden
      expect(screen.queryByText('Page 1 of 2')).not.toBeInTheDocument();
    });

    it('should show loading indicator during pagination', async () => {
      const mockResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse
      });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
      });

      // Mock a slow response for next page
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            json: async () => mockResponse
          }), 100)
        )
      );

      // Click Next button
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should show loading indicator
      expect(screen.getByText('Loading more data...')).toBeInTheDocument();
    });

    it('should call onDataLoad callback when data is loaded', async () => {
      const mockOnDataLoad = vi.fn();
      const mockResponse = {
        success: true,
        data: MANUFACTURING_FLOW_DATA,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 100,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => mockResponse
      });

      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
          dealId={1467}
          onDataLoad={mockOnDataLoad}
        />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(mockOnDataLoad).toHaveBeenCalledWith(
          MANUFACTURING_FLOW_DATA,
          mockResponse.pagination
        );
      });
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
