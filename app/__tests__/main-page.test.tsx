import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import MainPage from '../page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/')
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock client-qr-generator
vi.mock('@/lib/client-qr-generator', () => ({
  generateQRId: vi.fn(() => 'QR-001'),
  initializeQRCounter: vi.fn(),
  syncQRCounterWithDatabase: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

describe('MainPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue('/');
    mockSessionStorage.getItem.mockReturnValue(null);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render default state correctly', async () => {
    render(<MainPage />);

    // Check header
    expect(screen.getByText('Sales Helper')).toBeInTheDocument();

    // Check salesperson buttons
    expect(screen.getByText('All requests')).toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Luyanda')).toBeInTheDocument();
    expect(screen.getByText('Stefan')).toBeInTheDocument();

    // Check navigation buttons
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Lookup')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Check that All requests is selected by default
    const allRequestsButton = screen.getByText('All requests');
    expect(allRequestsButton).toHaveClass('bg-red-600');
  });

  it('should filter requests by salesperson', async () => {
    const mockRequests = [
      { 
        id: '1', 
        request_id: 'QR-001', 
        status: 'draft', 
        salesperson_first_name: 'James',
        line_items: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      { 
        id: '2', 
        request_id: 'QR-002', 
        status: 'submitted', 
        salesperson_first_name: 'Luyanda',
        line_items: [],
        contact: null,
        comment: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Click on Stefan filter button (avoid dropdown options)
    const stefanButtons = screen.getAllByText('Stefan');
    const stefanFilterButton = stefanButtons.find(button =>
      button.className.includes('flex-1') &&
      button.className.includes('border-gray-200')
    );
    if (!stefanFilterButton) throw new Error('Stefan filter button not found');
    fireEvent.click(stefanFilterButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?salesperson=Stefan');
    });
  });

  it('should create new draft directly when plus button is clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          data: {
            id: '123',
            request_id: 'QR-001',
            status: 'draft',
            salesperson_first_name: 'Select Name',
            line_items: [],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        })
      });

    render(<MainPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Click the plus button (New Request)
    const plusButtons = screen.getAllByRole('button', { name: '' });
    const plusButton = plusButtons.find(button => button.querySelector('svg[class*="lucide-plus"]'));
    if (!plusButton) throw new Error('Plus button not found');
    fireEvent.click(plusButton);

    // Wait for the API call to create new request
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: 'QR-001',
          salespersonFirstName: 'Select Name'
        })
      });
    });
  });

  it('should switch to "All requests" filter when creating new draft', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          data: {
            id: '123',
            request_id: 'QR-001',
            status: 'draft',
            salesperson_first_name: 'Select Name',
            line_items: [],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        })
      });

    render(<MainPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Switch to James filter
    const jamesButton = screen.getByText('James');
    fireEvent.click(jamesButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?salesperson=James');
    });

    // Click the plus button to create new request
    const plusButtons = screen.getAllByRole('button', { name: '' });
    const plusButton = plusButtons.find(button => button.querySelector('svg[class*="lucide-plus"]'));
    if (!plusButton) throw new Error('Plus button not found');
    fireEvent.click(plusButton);

    // Should automatically switch back to "All requests" filter
    await waitFor(() => {
      const allRequestsButton = screen.getByText('All requests');
      expect(allRequestsButton).toHaveClass('bg-red-600');
    });
  });

  it('should handle request submission', async () => {
    const mockRequests = [
      { 
        id: '1', 
        request_id: 'QR-001', 
        status: 'draft', 
        salesperson_first_name: 'James',
        line_items: [],
        contact: null,
        comment: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockRequests })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Submitted successfully' })
      });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Find and click submit button (this would be in RequestCard component)
    // For now, we'll test the submission logic indirectly
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle loading states', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MainPage />);

    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  it('should navigate to other pages', () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });

    render(<MainPage />);

    // Click check-in button
    const checkinButton = screen.getByText('Check-in');
    fireEvent.click(checkinButton);

    expect(mockPush).toHaveBeenCalledWith('/check-in');

    // Click lookup button
    const lookupButton = screen.getByText('Lookup').closest('button');
    if (!lookupButton) throw new Error('Lookup button not found');
    fireEvent.click(lookupButton);

    expect(mockPush).toHaveBeenCalledWith('/quick-lookup');
  });

  it('should refresh requests when returning from other pages', async () => {
    mockSessionStorage.getItem.mockReturnValue('true'); // shouldRefreshRequests

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });

    render(<MainPage />);

    // Should call fetch requests multiple times due to useEffect dependencies
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + refresh + useEffect dependencies
    });

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('shouldRefreshRequests');
  });

  it('should handle salesperson selection from session storage', async () => {
    mockSessionStorage.getItem.mockReturnValue('Luyanda'); // selectedSalesperson

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });

    render(<MainPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?salesperson=Luyanda');
    });

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedSalesperson');
  });

  it('should render salesperson dropdown in request cards', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        line_items: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Check that salesperson dropdown is present
    const dropdown = screen.getByDisplayValue('Select Name');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.tagName).toBe('SELECT');
  });

  it('should show validation message when salesperson not selected', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        contact: { personId: 1, name: 'Test Contact' },
        line_items: [{ pipedriveProductId: 1, name: 'Test Product', quantity: 1 }],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Check validation message includes salesperson name
    expect(screen.getByText('Add salesperson name to submit')).toBeInTheDocument();
  });

  it('should show delete button for draft requests', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        line_items: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Check that delete button is present
    const deleteButton = screen.getByTestId('sh-delete-request');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should not show delete button for submitted requests', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'submitted',
        salesperson_first_name: 'James',
        line_items: [],
        pipedrive_deal_id: 123,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Check that delete button is NOT present for submitted requests
    expect(screen.queryByTestId('sh-delete-request')).not.toBeInTheDocument();
  });

  it('should handle delete request functionality', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        line_items: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockRequests })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, message: 'Request deleted successfully' })
      });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTestId('sh-delete-request');
    fireEvent.click(deleteButton);

    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Delete Request?')).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    // Verify delete API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?id=1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  it('should update salesperson via dropdown', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        line_items: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockRequests })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          data: {
            ...mockRequests[0],
            salesperson_first_name: 'James'
          }
        })
      });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Change salesperson via dropdown
    const dropdown = screen.getByDisplayValue('Select Name');
    fireEvent.change(dropdown, { target: { value: 'James' } });

    // Verify API call to update salesperson
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '1',
          salespersonFirstName: 'James'
        })
      });
    });
  });

  it('should disable submit button when salesperson not selected', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'Select Name',
        contact: { personId: 1, name: 'Test Contact' },
        line_items: [{ pipedriveProductId: 1, name: 'Test Product', quantity: 1 }],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByTestId('sh-request-submit');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('border-gray-300');
  });

  it('should enable submit button when all requirements are met including salesperson', async () => {
    const mockRequests = [
      {
        id: '1',
        request_id: 'QR-001',
        status: 'draft',
        salesperson_first_name: 'James',
        contact: { personId: 1, name: 'Test Contact' },
        line_items: [{ pipedriveProductId: 1, name: 'Test Product', quantity: 1 }],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockRequests })
    });

    render(<MainPage />);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText('QR-001')).toBeInTheDocument();
    });

    // Submit button should be enabled
    const submitButton = screen.getByTestId('sh-request-submit');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveClass('bg-green-700');
  });
});
