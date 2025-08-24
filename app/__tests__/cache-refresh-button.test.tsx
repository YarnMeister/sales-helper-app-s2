import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CacheRefreshButton } from '../components/CacheRefreshButton';
import { vi } from 'vitest';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('CacheRefreshButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders refresh button', () => {
    render(<CacheRefreshButton />);
    
    expect(screen.getByTestId('cache-refresh-button')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh data from Pipedrive')).toBeInTheDocument();
  });

  it('handles successful cache refresh', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        message: 'Cache refreshed successfully' 
      }),
    } as Response);

    render(<CacheRefreshButton />);
    
    const button = screen.getByTestId('cache-refresh-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Cache Refreshed",
        description: "Data has been refreshed from Pipedrive. New contacts and products should now be visible.",
        duration: 3000,
      });
    });
  });

  it('handles cache refresh failure', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ 
        ok: false, 
        error: 'Failed to refresh cache' 
      }),
    } as Response);

    render(<CacheRefreshButton />);
    
    const button = screen.getByTestId('cache-refresh-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Refresh Failed",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    });
  });

  it('handles network error', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CacheRefreshButton />);
    
    const button = screen.getByTestId('cache-refresh-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Refresh Failed",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    });
  });

  it('shows loading state during refresh', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        } as Response), 100)
      )
    );

    render(<CacheRefreshButton />);
    
    const button = screen.getByTestId('cache-refresh-button');
    fireEvent.click(button);

    // Button should be disabled during refresh
    expect(button).toBeDisabled();

    // Icon should have spinning animation
    const icon = button.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
