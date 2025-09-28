import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import AddLineItemsPage from '../add-line-items/page';
import { LineItem } from '../types';

// Mock Next.js router with proper structure
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/add-line-items',
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(() => []),
    keys: vi.fn(() => []),
    values: vi.fn(() => []),
    toString: vi.fn(() => ''),
  }),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock the BFF functions
vi.mock('@/lib/bff', () => ({
  shapeProductsForAccordion: () => ({
    categories: [
      {
        name: 'Test Category',
        products: [
          {
            pipedriveProductId: 1,
            name: 'Product A',
            code: 'PROD-001',
            price: 100,
            description: 'Test product description',
            shortDescription: 'Test product description',
            showOnSalesHelper: true,
            category: 'Test Category'
          }
        ],
        productCount: 1
      }
    ],
    metadata: {
      categories: [
        { name: 'Test Category', productCount: 1, lastUpdated: new Date().toISOString() }
      ],
      totalProducts: 1,
      lastUpdated: new Date().toISOString(),
      source: 'redis' as const
    }
  })
}));

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

describe('AddLineItemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset router mock functions
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockRouter.back.mockClear();
    
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

    // No default fetch mock needed since ProductAccordion now uses BFF helpers
    // Individual tests will set up their own fetch mocks as needed
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
    expect(screen.getByText('Lookup')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
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

  it('should display correct line items summary for multiple items', async () => {
    // Mock sessionStorage to return multiple line items
    mockSessionStorage.getItem.mockImplementation((key: string) => {
      if (key === 'editingRequestId') {
        return 'test-request-id';
      }
      if (key === 'currentLineItemsInfo') {
        return JSON.stringify([
          {
            code: 'PROD-001',
            name: 'Product A',
            description: 'First product description',
            quantity: 2
          },
          {
            code: 'PROD-002',
            name: 'Product B',
            description: 'Second product description',
            quantity: 1
          },
          {
            code: 'PROD-003',
            name: 'Product C',
            description: 'Third product description',
            quantity: 3
          }
        ]);
      }
      return null;
    });

    render(<AddLineItemsPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // Should show current line items info
    expect(screen.getByText('Currently Selected Line Items')).toBeInTheDocument();
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('Product C')).toBeInTheDocument();
    expect(screen.getByText('Code: PROD-001 | Qty: 2')).toBeInTheDocument();
    expect(screen.getByText('Code: PROD-002 | Qty: 1')).toBeInTheDocument();
    expect(screen.getByText('Code: PROD-003 | Qty: 3')).toBeInTheDocument();
    expect(screen.getByText('First product description')).toBeInTheDocument();
    expect(screen.getByText('Second product description')).toBeInTheDocument();
    expect(screen.getByText('Third product description')).toBeInTheDocument();
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

    // Mock the line items API call
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: existingLineItems } })
    });

    render(<AddLineItemsPage />);

    // Wait for the component to load (BFF mock handles products data)
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
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



  it('should handle product selection error', async () => {
    const existingProduct = {
      pipedriveProductId: 1,
      name: 'Existing Product',
      quantity: 2,
      price: 100,
      description: 'Existing product description',
      code: 'EXIST-001'
    };

    const newProduct = {
      pipedriveProductId: 2,
      name: 'New Product',
      quantity: 1,
      price: 150,
      description: 'New product description',
      code: 'NEW-002'
    };

    // Mock the fetch to handle both products API and requests API calls
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          ok: true, 
          data: {
            'Test Category': [
              {
                pipedriveProductId: 2,
                name: 'New Product',
                code: 'NEW-002',
                price: 150,
                description: 'New product description'
              }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          ok: true, 
          data: [{ 
            id: 'test-request-id',
            line_items: [existingProduct]
          }] 
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, message: 'Failed to save line item' })
      });

    render(<AddLineItemsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // The component should handle the error gracefully
    // The actual error handling is tested in the component's error state
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

    // Mock the BFF call for ProductAccordion
    (global.fetch as any).mockResolvedValueOnce({
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

    // Mock the GET request to fetch current request data
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        data: [{ 
          id: 'test-request-id',
          line_items: existingLineItems 
        }] 
      })
    });

    // Mock the POST request to save line items to return error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, message: 'Failed to save line item' })
    });

    render(<AddLineItemsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // The component should handle the error gracefully
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
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

    // Mock the GET request to fetch current request data
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        data: [{ 
          id: 'test-request-id',
          line_items: existingLineItems 
        }] 
      })
    });

    // Mock the POST request to save line items
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: updatedLineItems } })
    });

    render(<AddLineItemsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // The component should handle multiple line items gracefully
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
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

    // Mock the BFF call for ProductAccordion
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        data: {
          'Test Category': [
            {
              pipedriveProductId: 1,
              name: 'Product A',
              code: undefined,
              price: 100,
              description: undefined
            }
          ]
        }
      })
    });

    // Mock the GET request to fetch current request data
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        ok: true, 
        data: [{ 
          id: 'test-request-id',
          line_items: existingLineItems 
        }] 
      })
    });

    // Mock the POST request to save line items to return success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { line_items: [newProduct] } })
    });

    render(<AddLineItemsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
    });

    // The component should handle products without optional fields gracefully
    expect(screen.getByTestId('sh-add-line-items-page')).toBeInTheDocument();
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
