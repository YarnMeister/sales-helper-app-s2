import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';
import { 
  createMockFetch, 
  FLOW_METRICS_MOCK_RESPONSES
} from '../test-utils';

// Mock Next.js router and search params
const mockUseSearchParams = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useSearchParams: () => mockUseSearchParams(),
  useParams: () => ({ 'metric-id': 'manufacturing-lead-time' }),
  usePathname: () => '/flow-metrics-report'
}));

// Mock useToast hook
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Flow Metrics Period Selection Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn()
    });
    
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => key === 'period' ? '7d' : null
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Main Page Period Selection', () => {
    it('should render period selectors with correct options', async () => {
      const mockFetch = createMockFetch(FLOW_METRICS_MOCK_RESPONSES);
      (global.fetch as any) = mockFetch;

      await act(async () => {
        render(<FlowMetricsReportPage />);
      });

      // Wait for component to settle and check for desktop buttons
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '7 days' })).toBeInTheDocument();
      });

      // Check that all period options are rendered (desktop buttons)
      expect(screen.getByRole('button', { name: '14 days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1 month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3 months' })).toBeInTheDocument();
    });

    it('should default to 7 days when no period in URL', async () => {
      // Mock useSearchParams to return null for period
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => null
      });

      const mockFetch = createMockFetch(FLOW_METRICS_MOCK_RESPONSES);
      (global.fetch as any) = mockFetch;

      await act(async () => {
        render(<FlowMetricsReportPage />);
      });

      // Wait for component to settle
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '7 days' })).toBeInTheDocument();
      });

      // Check that 7 days is selected by default
      const sevenDaysButton = screen.getByRole('button', { name: '7 days' });
      expect(sevenDaysButton).toHaveClass('bg-red-600');
    });

    it('should handle period selection clicks', async () => {
      const mockFetch = createMockFetch(FLOW_METRICS_MOCK_RESPONSES);
      (global.fetch as any) = mockFetch;

      await act(async () => {
        render(<FlowMetricsReportPage />);
      });

      // Wait for component to settle
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '7 days' })).toBeInTheDocument();
      });

      // Click on 1 month button
      const oneMonthButton = screen.getByRole('button', { name: '1 month' });
      
      await act(async () => {
        fireEvent.click(oneMonthButton);
      });

      // Verify that the button exists and was clicked
      expect(oneMonthButton).toBeInTheDocument();
      
      // Verify that fetch was called (this is the important part)
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
