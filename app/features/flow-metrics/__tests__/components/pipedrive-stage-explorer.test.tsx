import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PipedriveStageExplorer } from '../components/PipedriveStageExplorer';

// Mock fetch globally
global.fetch = vi.fn();

describe('PipedriveStageExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockPipelinesResponse = {
    success: true,
    data: [
      {
        id: 20,
        name: "Ruan - New Request OEM",
        order_nr: 0,
        active: true,
      },
      {
        id: 14,
        name: "Johan - Repairs - OEM",
        order_nr: 4,
        active: true,
      },
    ],
  };

  const mockStagesResponse = {
    success: true,
    data: [
      {
        id: 129,
        name: "New Request - Ruan",
        order_nr: 1,
        pipeline_id: 20,
        active_flag: true,
        deal_probability: 100,
      },
      {
        id: 58,
        name: "Budget Quotes (OEM/General)",
        order_nr: 2,
        pipeline_id: 20,
        active_flag: true,
        deal_probability: 100,
      },
    ],
  };

  it('should render the component with loading state initially', () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockPipelinesResponse,
    });

    render(<PipedriveStageExplorer />);

    expect(screen.getByText('🏗️ Pipedrive Stage Explorer')).toBeInTheDocument();
    expect(screen.getByText('Loading pipelines...')).toBeInTheDocument();
  });

  it('should display pipelines after successful fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPipelinesResponse,
    });

    render(<PipedriveStageExplorer />);

    await waitFor(() => {
      expect(screen.getByText('Ruan - New Request OEM')).toBeInTheDocument();
      expect(screen.getByText('Johan - Repairs - OEM')).toBeInTheDocument();
    });

    expect(screen.getByText('Pipeline ID: 20')).toBeInTheDocument();
    expect(screen.getByText('Pipeline ID: 14')).toBeInTheDocument();
  });

  it('should handle pipeline expansion and stage loading', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelinesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStagesResponse,
      });

    render(<PipedriveStageExplorer />);

    // Wait for pipelines to load
    await waitFor(() => {
      expect(screen.getByText('Ruan - New Request OEM')).toBeInTheDocument();
    });

    // Click on pipeline to expand
    const pipelineHeader = screen.getByRole('button', { name: /Toggle Ruan - New Request OEM stages/i });
    fireEvent.click(pipelineHeader);

    // Should show loading state for stages
    await waitFor(() => {
      expect(screen.getByText('Loading stages...')).toBeInTheDocument();
    });

    // Should show stages after loading
    await waitFor(() => {
      expect(screen.getByText('New Request - Ruan')).toBeInTheDocument();
      expect(screen.getByText('Budget Quotes (OEM/General)')).toBeInTheDocument();
    });

    // Should show stage IDs and order
    expect(screen.getByText('129')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<PipedriveStageExplorer />);

    await waitFor(() => {
      expect(screen.getByText('Error loading pipelines:')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should handle stage loading errors', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelinesResponse,
      })
      .mockRejectedValueOnce(new Error('Failed to fetch stages'));

    render(<PipedriveStageExplorer />);

    // Wait for pipelines to load
    await waitFor(() => {
      expect(screen.getByText('Ruan - New Request OEM')).toBeInTheDocument();
    });

    // Click on pipeline to expand
    const pipelineHeader = screen.getByRole('button', { name: /Toggle Ruan - New Request OEM stages/i });
    fireEvent.click(pipelineHeader);

    // Should show error for stages
    await waitFor(() => {
      expect(screen.getByText('Error loading stages:')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch stages')).toBeInTheDocument();
    });
  });

  it('should handle empty pipelines response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<PipedriveStageExplorer />);

    await waitFor(() => {
      expect(screen.getByText('No pipelines found')).toBeInTheDocument();
    });
  });

  it('should handle empty stages response', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPipelinesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<PipedriveStageExplorer />);

    // Wait for pipelines to load
    await waitFor(() => {
      expect(screen.getByText('Ruan - New Request OEM')).toBeInTheDocument();
    });

    // Click on pipeline to expand
    const pipelineHeader = screen.getByRole('button', { name: /Toggle Ruan - New Request OEM stages/i });
    fireEvent.click(pipelineHeader);

    // Should show no stages message
    await waitFor(() => {
      expect(screen.getByText('No stages found for this pipeline')).toBeInTheDocument();
    });
  });

  it('should show refresh button and handle manual refresh', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPipelinesResponse,
    });

    render(<PipedriveStageExplorer />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Ruan - New Request OEM')).toBeInTheDocument();
    });

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    // Mock second fetch for refresh
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPipelinesResponse,
    });

    fireEvent.click(refreshButton);

    // Should show loading state during refresh
    await waitFor(() => {
      expect(screen.getByText('Loading pipelines...')).toBeInTheDocument();
    });
  });

  it('should display active/inactive status badges correctly', async () => {
    const mixedPipelinesResponse = {
      success: true,
      data: [
        {
          id: 20,
          name: "Active Pipeline",
          order_nr: 0,
          active: true,
        },
        {
          id: 10,
          name: "Inactive Pipeline",
          order_nr: 1,
          active: false,
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mixedPipelinesResponse,
    });

    render(<PipedriveStageExplorer />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });
});
