import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetricsManagement } from '../../app/components/MetricsManagement';

// Mock the useToast hook
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the PipedriveStageExplorer component
vi.mock('../../app/components/PipedriveStageExplorer', () => ({
  PipedriveStageExplorer: () => <div data-testid="pipedrive-stage-explorer">Pipedrive Stage Explorer</div>,
}));

describe('MetricsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Delete Metric Functionality', () => {
    it('should show delete button for each metric', async () => {
      const mockMetrics = [
        {
          id: 'test-metric-1',
          metric_key: 'test-metric-1',
          display_title: 'Test Metric 1',
          canonical_stage: 'Test Stage 1',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'test-metric-2',
          metric_key: 'test-metric-2',
          display_title: 'Test Metric 2',
          canonical_stage: 'Test Stage 2',
          sort_order: 2,
          is_active: false,
          start_stage_id: 300,
          end_stage_id: 400,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock the initial fetch for metrics
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMetrics
        })
      });

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
        expect(screen.getByText('Test Metric 2')).toBeInTheDocument();
      });

      // Check that delete buttons are present
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(2);
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const mockMetrics = [
        {
          id: 'test-metric-1',
          metric_key: 'test-metric-1',
          display_title: 'Test Metric 1',
          canonical_stage: 'Test Stage 1',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock the initial fetch for metrics
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMetrics
        })
      });

      // Mock window.confirm
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this metric? This will also remove it from the main page.'
      );
    });

    it('should delete metric when confirmation is accepted', async () => {
      const mockMetrics = [
        {
          id: 'test-metric-1',
          metric_key: 'test-metric-1',
          display_title: 'Test Metric 1',
          canonical_stage: 'Test Stage 1',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      const deletedMetric = {
        id: 'test-metric-1',
        metric_key: 'test-metric-1',
        display_title: 'Test Metric 1',
        canonical_stage: 'Test Stage 1',
        sort_order: 1,
        is_active: true,
        start_stage_id: 100,
        end_stage_id: 200,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock the initial fetch for metrics
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMetrics
        })
      });

      // Mock the delete API call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: deletedMetric
        })
      });

      // Mock window.confirm to return true (user confirms deletion)
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/flow-metrics-config/test-metric-1',
        {
          method: 'DELETE',
        }
      );
    });

    it('should not delete metric when confirmation is cancelled', async () => {
      const mockMetrics = [
        {
          id: 'test-metric-1',
          metric_key: 'test-metric-1',
          display_title: 'Test Metric 1',
          canonical_stage: 'Test Stage 1',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock the initial fetch for metrics
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMetrics
        })
      });

      // Mock window.confirm to return false (user cancels deletion)
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      // Should not make DELETE API call when cancelled
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
    });

    it('should handle delete API errors gracefully', async () => {
      const mockMetrics = [
        {
          id: 'test-metric-1',
          metric_key: 'test-metric-1',
          display_title: 'Test Metric 1',
          canonical_stage: 'Test Stage 1',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock the initial fetch for metrics
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMetrics
        })
      });

      // Mock the delete API call to return an error
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to delete metric'
        })
      });

      // Mock window.confirm to return true
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<MetricsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/flow-metrics-config/test-metric-1',
        {
          method: 'DELETE',
        }
      );

      // The metric should still be visible since deletion failed
      await waitFor(() => {
        expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
      });
    });
  });
});
