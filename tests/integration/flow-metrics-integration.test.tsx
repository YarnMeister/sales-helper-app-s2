import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FlowMetricsReportPage from '../../app/flow-metrics-report/page';

// Mock Next.js router and search params with stable implementations
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: (key: string) => key === 'period' ? '7d' : null
  }),
  useParams: () => ({}),
  usePathname: () => '/flow-metrics-report'
}));

// Mock useToast hook with stable implementation
vi.mock('../../app/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock fetch with simple responses
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Flow Metrics Report - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: [] 
      })
    });
  });

  describe('Page Rendering', () => {
    it('should render the main page without crashing', async () => {
      render(<FlowMetricsReportPage />);
      
      // Basic smoke test - just check the page loads
      expect(screen.getByText('Flow Metrics Report')).toBeInTheDocument();
    });

    it('should show the three main view tabs', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
      expect(screen.getByText('Mappings')).toBeInTheDocument();
    });

    it('should show period selection options', () => {
      render(<FlowMetricsReportPage />);
      
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
      expect(screen.getByText('1 month')).toBeInTheDocument();
      expect(screen.getByText('3 months')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should start in Metrics view by default', () => {
      render(<FlowMetricsReportPage />);
      
      // Should show metrics-related content
      expect(screen.getByText('Lead Time Overview')).toBeInTheDocument();
    });

    it('should switch to Raw Data view when clicked', () => {
      render(<FlowMetricsReportPage />);
      
      // Click Raw Data tab
      screen.getByText('Raw Data').click();
      
      // Should show deal input form
      expect(screen.getByPlaceholderText('Enter Pipedrive deal ID')).toBeInTheDocument();
      expect(screen.getByText('Fetch')).toBeInTheDocument();
    });

    it('should switch to Mappings view when clicked', () => {
      render(<FlowMetricsReportPage />);
      
      // Click Mappings tab
      screen.getByText('Mappings').click();
      
      // Should show metrics management
      expect(screen.getByText('Flow Metrics Management')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should make API calls when page loads', () => {
      render(<FlowMetricsReportPage />);
      
      // Should call the metrics API
      expect(mockFetch).toHaveBeenCalledWith('/api/flow/metrics?period=7d');
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'API Error' 
        })
      });

      render(<FlowMetricsReportPage />);
      
      // Page should still render without crashing
      expect(screen.getByText('Flow Metrics Report')).toBeInTheDocument();
    });
  });
});
