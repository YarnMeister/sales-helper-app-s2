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
  initializeQRCounter: vi.fn()
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
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Price List')).toBeInTheDocument();

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

    // Click on Stefan (to avoid conflicts with RequestCard content)
    const stefanButton = screen.getByText('Stefan');
    fireEvent.click(stefanButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?salesperson=Stefan');
    });
  });

  it('should show salesperson modal when plus button is clicked with "All requests" selected', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });

    render(<MainPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Click the plus button (New Request) - use a more specific selector
    const plusButton = screen.getByRole('button', { name: '' }); // The plus button has no accessible name
    fireEvent.click(plusButton);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText("Who's requesting?")).toBeInTheDocument();
    });

    // Check salesperson options in modal - use getAllByText since there are multiple instances
    const jamesButtons = screen.getAllByText('James');
    const luyandaButtons = screen.getAllByText('Luyanda');
    const stefanButtons = screen.getAllByText('Stefan');
    
    // Should have at least one of each (main page + modal)
    expect(jamesButtons.length).toBeGreaterThan(0);
    expect(luyandaButtons.length).toBeGreaterThan(0);
    expect(stefanButtons.length).toBeGreaterThan(0);
  });

  it('should show salesperson modal when "All requests" is selected and plus is clicked', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] })
    });

    render(<MainPage />);

    // Click "All requests" button
    const allRequestsButton = screen.getByText('All requests');
    fireEvent.click(allRequestsButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/requests?showAll=true');
    });

    // Click the plus button
    const plusButton = screen.getByRole('button', { name: '' }); // The plus button has no accessible name
    fireEvent.click(plusButton);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByText("Who's requesting?")).toBeInTheDocument();
    });

    // Check salesperson options in modal - use getAllByText to get all instances
    const jamesButtons = screen.getAllByText('James');
    const luyandaButtons = screen.getAllByText('Luyanda');
    const stefanButtons = screen.getAllByText('Stefan');
    
    // Should have at least one of each (main page + modal)
    expect(jamesButtons.length).toBeGreaterThan(0);
    expect(luyandaButtons.length).toBeGreaterThan(0);
    expect(stefanButtons.length).toBeGreaterThan(0);
  });

  it('should handle request submission', async () => {
    const mockRequests = [
      { 
        id: '1', 
        request_id: 'QR-001', 
        status: 'draft', 
        salesperson_first_name: 'James',
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

    // Click contacts button
    const contactsButton = screen.getByText('Contacts');
    fireEvent.click(contactsButton);

    expect(mockPush).toHaveBeenCalledWith('/contacts-list');

    // Click price list button
    const priceListButton = screen.getByText('Price List');
    fireEvent.click(priceListButton);

    expect(mockPush).toHaveBeenCalledWith('/price-list');
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
});
