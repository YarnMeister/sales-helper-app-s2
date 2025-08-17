import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductAccordion } from '../components/ProductAccordion';

const mockProductsData = {
  'Category A': [
    {
      pipedriveProductId: 1,
      name: 'Product Alpha',
      price: 100.00,
      description: 'High-quality product'
    },
    {
      pipedriveProductId: 2,
      name: 'Product Beta',
      price: 150.00,
      description: 'Premium product'
    }
  ],
  'Category B': [
    {
      pipedriveProductId: 3,
      name: 'Product Gamma',
      price: 75.00,
      description: 'Standard product'
    }
  ]
};

global.fetch = jest.fn();

describe('ProductAccordion - Streamlined Selection', () => {
  const mockOnProductSelect = jest.fn();
  const existingItems = [
    {
      pipedriveProductId: 4,
      name: 'Existing Product',
      quantity: 2,
      price: 50.00
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockProductsData,
        stale: false
      })
    });
  });

  it('immediately calls onProductSelect when product is clicked', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    // Expand category
    fireEvent.click(screen.getByTestId('sh-product-category-category-a'));

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Click product - should immediately trigger selection
    fireEvent.click(screen.getByTestId('sh-product-item-1'));

    expect(mockOnProductSelect).toHaveBeenCalledWith({
      pipedriveProductId: 1,
      name: 'Product Alpha',
      quantity: 1,
      price: 100.00
    });
  });

  it('does not show product selection preview', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    // Should not show any "Order Summary" preview
    expect(screen.queryByText(/Order Summary/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sh-order-summary-preview')).not.toBeInTheDocument();
  });

  it('does not show save/cancel buttons', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    // Should not show any action buttons
    expect(screen.queryByText('Save Products')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('does not show individual Add buttons on product rows', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Should not show "Add" buttons on individual rows
    expect(screen.queryByText('Add')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sh-product-add-button-1')).not.toBeInTheDocument();
  });

  it('shows "Added" badge for existing items', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Should show "Added" badge for existing items
    const existingItemElement = screen.getByTestId('sh-product-item-4');
    expect(existingItemElement).toHaveTextContent('Added');
  });

  it('makes entire product row clickable', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // The entire row should be clickable
    const productRow = screen.getByTestId('sh-product-item-1');
    expect(productRow).toHaveClass('cursor-pointer');
    
    fireEvent.click(productRow);
    expect(mockOnProductSelect).toHaveBeenCalled();
  });

  it('handles product selection with keyboard', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Test Enter key selection
    const productElement = screen.getByTestId('sh-product-item-1');
    fireEvent.keyDown(productElement, { key: 'Enter' });

    expect(mockOnProductSelect).toHaveBeenCalledWith({
      pipedriveProductId: 1,
      name: 'Product Alpha',
      quantity: 1,
      price: 100.00
    });
  });

  it('handles product selection with Space key', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Test Space key selection
    const productElement = screen.getByTestId('sh-product-item-1');
    fireEvent.keyDown(productElement, { key: ' ' });

    expect(mockOnProductSelect).toHaveBeenCalledWith({
      pipedriveProductId: 1,
      name: 'Product Alpha',
      quantity: 1,
      price: 100.00
    });
  });

  it('maintains accessibility attributes', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    const productElement = screen.getByTestId('sh-product-item-1');
    expect(productElement).toHaveAttribute('role', 'button');
    expect(productElement).toHaveAttribute('tabIndex', '0');
  });

  it('handles multiple product selections correctly', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
      expect(screen.getByText('Product Beta')).toBeInTheDocument();
    });

    // Select first product
    fireEvent.click(screen.getByTestId('sh-product-item-1'));
    expect(mockOnProductSelect).toHaveBeenCalledTimes(1);

    // Select second product
    fireEvent.click(screen.getByTestId('sh-product-item-2'));
    expect(mockOnProductSelect).toHaveBeenCalledTimes(2);
  });

  it('handles products with missing optional fields', async () => {
    const productsWithMissingFields = {
      'Category C': [
        {
          pipedriveProductId: 5,
          name: 'Product Delta'
          // Missing price and description
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: productsWithMissingFields,
        stale: false
      })
    });

    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-c'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Delta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-product-item-5'));

    expect(mockOnProductSelect).toHaveBeenCalledWith({
      pipedriveProductId: 5,
      name: 'Product Delta',
      quantity: 1
    });
  });

  it('filters products based on search', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sh-product-search')).toBeInTheDocument();
    });

    // Search for specific product
    const searchInput = screen.getByTestId('sh-product-search');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    // Should still show the category but filtered
    await waitFor(() => {
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });
  });

  it('expands and collapses product categories', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    // Initially products should not be visible
    expect(screen.queryByText('Product Alpha')).not.toBeInTheDocument();

    // Expand category
    fireEvent.click(screen.getByTestId('sh-product-category-category-a'));

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
      expect(screen.getByText('Product Beta')).toBeInTheDocument();
    });

    // Collapse category
    fireEvent.click(screen.getByTestId('sh-product-category-category-a'));

    await waitFor(() => {
      expect(screen.queryByText('Product Alpha')).not.toBeInTheDocument();
    });
  });

  it('displays product prices correctly', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Should display price
    expect(screen.getByText('R100.00')).toBeInTheDocument();
  });

  it('displays product descriptions when available', async () => {
    render(
      <ProductAccordion 
        onProductSelect={mockOnProductSelect} 
        existingItems={existingItems}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-category-a'));
    });

    await waitFor(() => {
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    // Should display description
    expect(screen.getByText('High-quality product')).toBeInTheDocument();
  });
});
