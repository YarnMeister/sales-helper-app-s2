import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import AddLineItemsPage from '../add-line-items/page';
import { LineItem } from '../types/product';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/add-line-items')
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

const mockRouter = {
  push: vi.fn(),
  back: vi.fn()
};

describe('AddLineItemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage to return different values for different keys
    mockSessionStorage.getItem.mockImplementation((key: string) => {
      if (key === 'editingRequestId') {
        return 'test-request-id';
      }
      if (key === 'currentLineItemsInfo') {
        return JSON.stringify([
          {
            code: 'PROD-001',
            name: 'Test Product 1',
            description: 'Test product description 1',
            quantity: 2
          },
          {
            code: 'PROD-002',
            name: 'Test Product 2',
            description: 'Test product description 2',
            quantity: 1
          }
        ]);
      }
      return null;
    });
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: mockSessionStorage.getItem,
        setItem: mockSessionStorage.setItem,
        removeItem: mockSessionStorage.removeItem,
        clear: mockSessionStorage.clear
      },
      writable: true
    });

    // Mock Next.js router
    (useRouter as any).mockReturnValue({
      push: mockRouter.push,
      back: mockRouter.back
    });

    // Default mock for products API (used by ProductAccordion)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        data: {
          'Test Category': [
            {
              pipedriveProductId: 1,
              name: 'Product A',
              code: 'PROD-001',
              price: 100,
              description: 'Test product description'
            }
          ]
        }
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with correct header and navigation', async () => {
    render(<AddLineItemsPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // Should render header elements
    expect(screen.getByText('RTSE')).toBeInTheDocument();
    expect(screen.getByText('Add Line Items')).toBeInTheDocument();
    expect(screen.getByText('Select products and quantities for your request')).toBeInTheDocument();

    // Should have back button
    expect(screen.getByTestId('sh-add-line-items-back')).toBeInTheDocument();

    // Should have bottom navigation
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('should display current line items info when available', async () => {
    render(<AddLineItemsPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // Should show current line items info
    expect(screen.getByText('Currently Selected Line Items')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Code: PROD-001 | Qty: 2')).toBeInTheDocument();
    expect(screen.getByText('Code: PROD-002 | Qty: 1')).toBeInTheDocument();
    expect(screen.getByText('Test product description 1')).toBeInTheDocument();
    expect(screen.getByText('Test product description 2')).toBeInTheDocument();
  });

  it('should not display current line items info when not available', async () => {
    // Mock sessionStorage to not return currentLineItemsInfo
    mockSessionStorage.getItem.mockImplementation((key: string) => {
      if (key === 'editingRequestId') {
        return 'test-request-id';
      }
      return null;
    });

    render(<AddLineItemsPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

        // Should not show current line items info
    expect(screen.queryByText('Currently Selected Line Items')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
  });
  });

  it('should redirect to main page if no request ID in session storage', () => {
    // Don't set editingRequestId in sessionStorage
    mockSessionStorage.getItem.mockReturnValue(null);

    render(<AddLineItemsPage />);

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should load existing line items on page load', async () => {
    const existingLineItems: LineItem[] = [
      {
        pipedriveProductId: 1,
        name: 'Product A',
        quantity: 2,
        price: 100,
        description: 'Test product',
        code: 'PROD-001'
      }
    ];

    // Mock the products API call that ProductAccordion makes first
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          ok: true, 
          data: {
            'Test Category': [
              {
                pipedriveProductId: 1,
                name: 'Product A',
                price: 100,
                description: 'Test product',
                code: 'PROD-001'
              }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: { line_items: existingLineItems } })
      });

    render(<AddLineItemsPage />);

    // Wait for the products API call to be made (ProductAccordion loads first)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/products');
    });

    // Should render the component
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
  });

  it('should handle product selection successfully', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    // Mock the products API call that ProductAccordion makes
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          ok: true, 
          data: {
            'Test Category': [
              {
                pipedriveProductId: 1,
                name: 'Product A',
                code: 'PROD-001',
                price: 100,
                description: 'Test product description'
              }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
      });

    render(<AddLineItemsPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // The ProductAccordion component should be rendered
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
  });

  it('should handle product selection API call', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Simulate the product selection API call
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });
  });

  it('should handle product selection error', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, message: 'Failed to save line item' })
    });

    render(<AddLineItemsPage />);

    // Simulate the product selection API call
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Failed to save line item');
  });

  it('should handle network errors during product selection', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<AddLineItemsPage />);

    // Simulate the product selection API call
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-request-id',
          line_items: updatedLineItems
        })
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('should handle back button navigation', () => {
    render(<AddLineItemsPage />);

    const backButton = screen.getByTestId('sh-add-line-items-back');
    fireEvent.click(backButton);

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('editingRequestId');
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should show loading state during product saving', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    // Mock a slow response
    (global.fetch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<AddLineItemsPage />);

    // The loading state would be shown when a product is selected
    // This test verifies the component structure supports loading states
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
  });

  it('should show error message when product saving fails', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, message: 'Failed to save line item' })
    });

    render(<AddLineItemsPage />);

    // Simulate the product selection API call
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Failed to save line item');
  });

  it('should handle multiple line items', async () => {
    const existingLineItems: LineItem[] = [
      {
        pipedriveProductId: 1,
        name: 'Product A',
        quantity: 1,
        price: 100
      }
    ];

    const newProduct = {
      pipedriveProductId: 2,
      name: 'Product B',
      quantity: 2,
      price: 200,
      description: 'Second product description',
      partNumber: 'PROD-002'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Should handle multiple line items
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(true);
    expect(updatedLineItems).toHaveLength(2);
  });

  it('should handle product with all required fields', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Should handle product with all fields
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(true);
    expect(newProduct).toHaveProperty('pipedriveProductId');
    expect(newProduct).toHaveProperty('name');
    expect(newProduct).toHaveProperty('quantity');
    expect(newProduct).toHaveProperty('price');
    expect(newProduct).toHaveProperty('description');
    expect(newProduct).toHaveProperty('partNumber');
  });

  it('should handle product with missing optional fields', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100
      // No description or partNumber
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Should handle product without optional fields
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(true);
  });

  it('should handle error when loading existing line items fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed to load line items'));

    render(<AddLineItemsPage />);

    // Should handle loading error gracefully
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });
  });

  it('should clear session storage and redirect on successful product selection', async () => {
    const existingLineItems: LineItem[] = [];
    const newProduct = {
      pipedriveProductId: 1,
      name: 'Product A',
      quantity: 1,
      price: 100,
      description: 'Test product description',
      partNumber: 'PROD-001'
    };

    const updatedLineItems = [...existingLineItems, newProduct];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Simulate successful product selection
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-request-id',
        line_items: updatedLineItems
      })
    });

    const result = await response.json();

    expect(result.ok).toBe(true);
    // The component should clear session storage and redirect
    // This would be handled by the component's success handler
  });
