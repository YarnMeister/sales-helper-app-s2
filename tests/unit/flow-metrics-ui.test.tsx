import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ViewToggle } from '../../app/components/ViewToggle';
import { DealInputForm } from '../../app/components/DealInputForm';
import FlowDataTable from '../../app/components/FlowDataTable';
import { MetricsManagement } from '../../app/components/MetricsManagement';
import { MANUFACTURING_FLOW_DATA } from '../test-utils';

// Mock the toast hook
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Flow Metrics UI Components', () => {
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
      expect(rawDataButton).toHaveClass('bg-gray-700', 'text-white');
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
        data: MANUFACTURING_FLOW_DATA,
        message: 'Successfully fetched flow data'
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockFetchResponse)
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
      const mockErrorResponse = {
        success: false,
        error: 'Deal not found',
        message: 'The requested deal could not be fetched'
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockErrorResponse)
      });

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '999999' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(mockOnFetchSuccess).not.toHaveBeenCalled();
      });
    });

    it('should show loading state', async () => {
      const mockOnFetchSuccess = vi.fn();
      
      // Mock a delayed response to test loading state
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: () => Promise.resolve({ success: true, data: [] })
        }), 100))
      );

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      // Enter a deal ID and click fetch to trigger loading state
      const input = screen.getByPlaceholderText('Enter Pipedrive deal ID');
      const fetchButton = screen.getByText('Fetch');
      
      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      // Should show loading state immediately after clicking
      expect(screen.getByText('Fetching...')).toBeInTheDocument();
      expect(screen.getByText('Fetching...')).toBeDisabled();
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
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
        />
      );

      expect(screen.getByText('No flow data available. Enter a deal ID above to fetch data.')).toBeInTheDocument();
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

    it('should show row limit controls when data exceeds limit', () => {
      // Create data that exceeds the 50 row limit
      const largeDataSet = Array.from({ length: 75 }, (_, index) => ({
        id: `${index + 1}`,
        deal_id: 1467,
        pipeline_id: 1,
        stage_id: 5,
        stage_name: `Stage ${index + 1}`,
        entered_at: '2025-08-11T12:28:28.000Z',
        left_at: null,
        duration_seconds: null,
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      }));

      render(
        <FlowDataTable 
          data={largeDataSet}
          isLoading={false}
        />
      );

      // Should show "Show All" button when data exceeds limit
      expect(screen.getByText('Show All (75 rows)')).toBeInTheDocument();
      expect(screen.getByText('Showing 50 of 75 rows')).toBeInTheDocument();
    });

    it('should toggle between showing limited and all rows', () => {
      // Create data that exceeds the 50 row limit
      const largeDataSet = Array.from({ length: 75 }, (_, index) => ({
        id: `${index + 1}`,
        deal_id: 1467,
        pipeline_id: 1,
        stage_id: 5,
        stage_name: `Stage ${index + 1}`,
        entered_at: '2025-08-11T12:28:28.000Z',
        left_at: null,
        duration_seconds: null,
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      }));

      render(
        <FlowDataTable 
          data={largeDataSet}
          isLoading={false}
        />
      );

      // Initially should show limited rows
      expect(screen.getByText('Show All (75 rows)')).toBeInTheDocument();
      
      // Click to show all rows
      fireEvent.click(screen.getByText('Show All (75 rows)'));
      
      // Should now show "Show Less" button
      expect(screen.getByText('Show Less (50 rows)')).toBeInTheDocument();
      
      // Click to show less rows again
      fireEvent.click(screen.getByText('Show Less (50 rows)'));
      
      // Should be back to "Show All" button
      expect(screen.getByText('Show All (75 rows)')).toBeInTheDocument();
    });
  });

  describe('MetricsManagement', () => {
    it('should render metrics table', async () => {
      // Mock successful response with correct data structure
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              sort_order: 1,
              is_active: true,
              start_stage_id: 100,
              end_stage_id: 200,
              avg_min_days: 5,
              avg_max_days: 15,
              metric_comment: 'Test comment',
              created_at: '2023-01-01',
              updated_at: '2023-01-01'
            },
            {
              id: '2',
              metric_key: 'oem-order',
              display_title: 'OEM Order Lead Time',
              canonical_stage: 'OEM Order',
              sort_order: 2,
              is_active: true,
              start_stage_id: 300,
              end_stage_id: 400,
              avg_min_days: 3,
              avg_max_days: 10,
              metric_comment: null,
              created_at: '2023-01-01',
              updated_at: '2023-01-01'
            }
          ] 
        })
      });

      render(<MetricsManagement />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
        expect(screen.getByText('OEM Order Lead Time')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<MetricsManagement />);

      // Should show loading spinner initially
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('should show empty state when no metrics', async () => {
      // Mock empty response
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      });
    });

    it('should handle edit mode for Manufacturing Lead Time (cornerstone test)', async () => {
      // Mock successful response with correct data structure
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              sort_order: 1,
              is_active: true,
              start_stage_id: 100,
              end_stage_id: 200,
              avg_min_days: 5,
              avg_max_days: 15,
              metric_comment: 'Test comment',
              created_at: '2023-01-01',
              updated_at: '2023-01-01'
            }
          ] 
        })
      });

      render(<MetricsManagement />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Should show edit form
      expect(screen.getByDisplayValue('Manufacturing Lead Time')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle save functionality for Manufacturing Lead Time', async () => {
      // Mock successful response with correct data structure
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: '1',
              metric_key: 'manufacturing',
              display_title: 'Manufacturing Lead Time',
              canonical_stage: 'Manufacturing',
              sort_order: 1,
              is_active: true,
              start_stage_id: 100,
              end_stage_id: 200,
              avg_min_days: 5,
              avg_max_days: 15,
              metric_comment: 'Test comment',
              created_at: '2023-01-01',
              updated_at: '2023-01-01'
            }
          ] 
        })
      });

      render(<MetricsManagement />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Update the title
      const titleInput = screen.getByDisplayValue('Manufacturing Lead Time');
      fireEvent.change(titleInput, { target: { value: 'Updated Manufacturing Lead Time' } });

      // Mock the PATCH request
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      // Should show success message
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/flow-metrics-config/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Updated Manufacturing Lead Time')
        });
      });
    });

    it('should handle add new metric', async () => {
      // Mock empty response initially
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] })
      });

      render(<MetricsManagement />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No metrics found. Click "Add New Metric" to create one.')).toBeInTheDocument();
      });

      // Click add new metric button
      fireEvent.click(screen.getByText('Add New Metric'));

      // Should show add form with new fields
      expect(screen.getByLabelText('Metric Key *')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Canonical Stage *')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Stage ID')).toBeInTheDocument();
      expect(screen.getByLabelText('End Stage ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Avg Min (days)')).toBeInTheDocument();
      expect(screen.getByLabelText('Avg Max (days)')).toBeInTheDocument();
      expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<MetricsManagement />);

      // Should show error message via toast (already mocked at the top of the file)
      await waitFor(() => {
        // The toast is already mocked globally, so we just need to wait for the component to handle the error
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
