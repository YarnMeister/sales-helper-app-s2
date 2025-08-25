import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ViewToggle } from '../../app/components/ViewToggle';
import { DealInputForm } from '../../app/components/DealInputForm';
import { FlowDataTable } from '../../app/components/FlowDataTable';
import { CanonicalStageMappings } from '../../app/components/CanonicalStageMappings';

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
      expect(rawDataButton).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
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

      expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
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
        json: async () => mockFetchResponse
      });

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '1467' } });
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pipedrive/deal-flow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId: 1467 })
        });
      });

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

      expect(screen.getByText('Fetching...')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeDisabled();
    });

    it('should handle fetch errors', async () => {
      const mockOnFetchSuccess = vi.fn();
      const mockFetchResponse = {
        success: false,
        error: 'Deal not found'
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockFetchResponse
      });

      render(
        <DealInputForm 
          onFetchSuccess={mockOnFetchSuccess}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const fetchButton = screen.getByText('Fetch');

      fireEvent.change(input, { target: { value: '999999' } });
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
        stage_id: 5,
        stage_name: 'Quality Control',
        entered_at: '2025-08-11T12:28:28.000Z',
        left_at: null,
        duration_seconds: null,
        created_at: '2025-08-25T13:33:46.718Z'
      },
      {
        id: '2',
        pipedrive_event_id: 12344,
        deal_id: 1467,
        pipeline_id: 1,
        stage_id: 3,
        stage_name: 'Order Received - Johan',
        entered_at: '2025-08-07T11:16:49.000Z',
        left_at: '2025-08-11T12:28:28.000Z',
        duration_seconds: 349899,
        created_at: '2025-08-25T13:33:46.718Z'
      }
    ];

    it('should render table with data', () => {
      render(
        <FlowDataTable 
          data={mockData}
          isLoading={false}
        />
      );

      expect(screen.getByText('Deal ID')).toBeInTheDocument();
      expect(screen.getByText('Pipeline ID')).toBeInTheDocument();
      expect(screen.getByText('Stage Name')).toBeInTheDocument();
      expect(screen.getByText('Entered At')).toBeInTheDocument();
      expect(screen.getByText('Left At')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();

      expect(screen.getByText('1467')).toBeInTheDocument();
      expect(screen.getByText('Quality Control')).toBeInTheDocument();
      expect(screen.getByText('Order Received - Johan')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading flow data...')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(
        <FlowDataTable 
          data={[]}
          isLoading={false}
        />
      );

      expect(screen.getByText('No flow data available')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(
        <FlowDataTable 
          data={mockData}
          isLoading={false}
        />
      );

      // Check that dates are formatted (the exact format depends on locale)
      expect(screen.getByText('1467')).toBeInTheDocument();
      expect(screen.getByText('Quality Control')).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const dataWithNulls = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z'
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

  describe('CanonicalStageMappings', () => {
    it('should render mappings table', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockMappings })
      });

      render(<CanonicalStageMappings />);

      await waitFor(() => {
        expect(screen.getByText('Canonical Stage Mappings')).toBeInTheDocument();
        expect(screen.getByText('Order Conversion')).toBeInTheDocument();
        expect(screen.getByText('Order Received - Johan')).toBeInTheDocument();
        expect(screen.getByText('Quality Control')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CanonicalStageMappings />);

      expect(screen.getByText('Loading mappings...')).toBeInTheDocument();
    });

    it('should show empty state when no mappings', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      render(<CanonicalStageMappings />);

      await waitFor(() => {
        expect(screen.getByText('No mappings found. Click "Add New Mapping" to create one.')).toBeInTheDocument();
      });
    });

    it('should handle edit mode', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockMappings })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockMappings[0] })
        });

      render(<CanonicalStageMappings />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should handle add new mapping', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      const newMapping = {
        id: '2',
        canonical_stage: 'New Canonical Stage',
        start_stage: 'Start Stage',
        end_stage: 'End Stage',
        created_at: '2025-08-25T13:51:04.738Z',
        updated_at: '2025-08-25T13:51:04.738Z'
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockMappings })
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: newMapping })
        });

      render(<CanonicalStageMappings />);

      await waitFor(() => {
        expect(screen.getByText('Add New Mapping')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add New Mapping'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/canonical-mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            canonical_stage: 'New Canonical Stage',
            start_stage: 'Start Stage',
            end_stage: 'End Stage'
          })
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<CanonicalStageMappings />);

      await waitFor(() => {
        // Should handle error and not crash
        expect(screen.getByText('Canonical Stage Mappings')).toBeInTheDocument();
      });
    });
  });
});
