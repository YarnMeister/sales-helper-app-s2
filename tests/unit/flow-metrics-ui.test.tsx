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
      expect(rawDataButton).toHaveClass('bg-blue-600', 'text-white');
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

    it('should show loading state', () => {
      const mockOnFetchSuccess = vi.fn();
      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={true}
        />
      );

      expect(screen.getByText('Fetching...')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeDisabled();
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
      expect(screen.getByText('3')).toBeInTheDocument();
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
    it('should render metrics table', () => {
      render(<MetricsManagement />);

      expect(screen.getByText('Metrics Management')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      expect(screen.getByText('OEM Order Lead Time')).toBeInTheDocument();
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
        expect(screen.getByText('No metrics configured')).toBeInTheDocument();
      });
    });

    it('should handle edit mode for Manufacturing Lead Time (cornerstone test)', async () => {
      // Mock successful response
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: 1,
              title: 'Manufacturing Lead Time',
              pipeline_id: 1,
              stage_id: 5,
              status: 'active'
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
      // Mock successful response
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: 1,
              title: 'Manufacturing Lead Time',
              pipeline_id: 1,
              stage_id: 5,
              status: 'active'
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

      // Mock save response
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, message: 'Metric updated successfully' })
      });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Metric updated successfully')).toBeInTheDocument();
      });
    });

    it('should handle add new metric', async () => {
      // Mock successful response
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ 
          success: true, 
          data: [
            {
              id: 1,
              title: 'Manufacturing Lead Time',
              pipeline_id: 1,
              stage_id: 5,
              status: 'active'
            }
          ] 
        })
      });

      render(<MetricsManagement />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Lead Time')).toBeInTheDocument();
      });

      // Click add new metric button
      fireEvent.click(screen.getByText('Add New Metric'));

      // Should show add form
      expect(screen.getByPlaceholderText('Enter metric title')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<MetricsManagement />);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });
    });
  });
});
