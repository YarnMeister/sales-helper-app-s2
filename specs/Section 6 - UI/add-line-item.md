Add Line Items Page Implementation - Sales Helper App
Overview
Implement the Add Line Items page using the same accordion pattern as Add Contacts but with a 2-tier structure (Product Group → Products). Include quantity controls, multi-selection support, and seamless integration with the main page.

1. Product Data Types and Interfaces
Cursor Prompt:
Create TypeScript interfaces for the hierarchical product data structure that matches the caching API from Section 3.

Create `/app/types/product.ts`:

export interface Product {
  pipedriveProductId: number;
  name: string;
  code?: string;
  price?: number;
  shortDescription?: string;
}

export interface LineItem {
  pipedriveProductId: number;
  name: string;
  code?: string;
  price?: number;
  quantity: number;
  shortDescription?: string;
  customDescription?: string;
}

export interface ProductsHierarchy {
  [category: string]: Product[];
}

export interface ProductsApiResponse {
  ok: boolean;
  data: ProductsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

export interface ProductSelectionState {
  expandedCategories: Set<string>;
  selectedProducts: Map<number, LineItem>; // productId -> LineItem
  searchTerm: string;
}

export interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}
Manual Validation:

 Interfaces match the API response structure from Section 3.3
 LineItem interface supports quantity and customization
 ProductsHierarchy supports 2-tier structure (Category → Products)
 State interface captures product selection with quantities


2. Quantity Control Component
Cursor Prompt:
Create reusable quantity control component with jumbo +/- buttons for mobile-first design.

Create `/app/components/QuantityControl.tsx`:

import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  productName?: string; // For accessibility
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  size = 'md',
  disabled = false,
  productName = 'product'
}) => {
  const handleDecrease = () => {
    const newQuantity = Math.max(min, quantity - 1);
    onQuantityChange(newQuantity);
  };

  const handleIncrease = () => {
    const newQuantity = Math.min(max, quantity + 1);
    onQuantityChange(newQuantity);
  };

  const handleDirectInput = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onQuantityChange(numValue);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'h-8 w-8',
      text: 'text-sm',
      input: 'h-8 w-12 text-sm'
    },
    md: {
      button: 'h-10 w-10',
      text: 'text-base',
      input: 'h-10 w-16 text-base'
    },
    lg: {
      button: 'h-12 w-12',
      text: 'text-lg',
      input: 'h-12 w-20 text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div 
      className="flex items-center gap-2"
      data-testid={`sh-quantity-control-${productName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 active:bg-red-100`}
        aria-label={`Decrease quantity of ${productName} (currently ${quantity})`}
        data-testid="sh-quantity-decrease"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center">
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleDirectInput(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          className={`${classes.input} ${classes.text} border border-gray-300 rounded text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          aria-label={`Quantity of ${productName}`}
          data-testid="sh-quantity-input"
        />
        <span className="text-xs text-gray-500 mt-1">Qty</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 active:bg-green-100`}
        aria-label={`Increase quantity of ${productName} (currently ${quantity})`}
        data-testid="sh-quantity-increase"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
Manual Validation:

 Jumbo buttons are touch-friendly (min 44px)
 Quantity input allows direct editing
 Decrease button disabled at minimum (1)
 Increase button works up to maximum (999)
 Hover states provide visual feedback
 Accessibility labels describe current state
 Different sizes work correctly


3. Product Accordion Component
Cursor Prompt:
Create a product selection accordion component reusing the design patterns from ContactAccordion but optimized for 2-tier structure with quantity controls.

Create `/app/components/ProductAccordion.tsx`:

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Search, Package, Check, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, LineItem, ProductsHierarchy, ProductSelectionState } from '@/types/product';
import { QuantityControl } from '@/components/QuantityControl';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductAccordionProps {
  onProductsChange: (products: LineItem[]) => void;
  selectedProducts: LineItem[];
  className?: string;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({
  onProductsChange,
  selectedProducts,
  className = ''
}) => {
  const [productsData, setProductsData] = useState<ProductsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const isOnline = useNetworkStatus();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Convert selectedProducts array to Map for easier lookup
  const selectedProductsMap = useMemo(() => {
    return new Map(selectedProducts.map(item => [item.pipedriveProductId, item]));
  }, [selectedProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.ok) {
        setProductsData(data.data);
        setStale(data.stale || false);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Unable to load products. Please check your connection.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProductsData = useMemo(() => {
    if (!debouncedSearchTerm) return productsData;

    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return Object.entries(productsData).reduce((acc, [category, products]) => {
      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.shortDescription?.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower)
      );
      
      if (filteredProducts.length > 0) {
        acc[category] = filteredProducts;
      }
      return acc;
    }, {} as ProductsHierarchy);
  }, [productsData, debouncedSearchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return newExpanded;
    });
  };

  const handleProductAdd = (product: Product) => {
    const newLineItem: LineItem = {
      pipedriveProductId: product.pipedriveProductId,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: 1, // Default quantity
      shortDescription: product.shortDescription
    };

    const updatedProducts = [...selectedProducts, newLineItem];
    onProductsChange(updatedProducts);
  };

  const handleProductRemove = (productId: number) => {
    const updatedProducts = selectedProducts.filter(item => item.pipedriveProductId !== productId);
    onProductsChange(updatedProducts);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const updatedProducts = selectedProducts.map(item =>
      item.pipedriveProductId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    onProductsChange(updatedProducts);
  };

  const getTotalItems = () => selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalValue = () => selectedProducts.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-products-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-products-error">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchProducts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className} data-testid="sh-product-accordion">
      <OfflineBanner isOnline={isOnline} isStale={stale} />

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products, categories, or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base"
            data-testid="sh-product-search"
          />
        </div>
      </div>

      {/* Selection Summary */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">
              Selected Products ({selectedProducts.length})
            </h3>
          </div>
          <div className="space-y-1 text-sm text-green-800">
            <p>Total Items: {getTotalItems()}</p>
            {getTotalValue() > 0 && (
              <p>Total Value: R{getTotalValue().toFixed(2)}</p>
            )}
          </div>
        </div>
      )}

      {/* Products Hierarchy */}
      <div className="space-y-3" data-testid="sh-products-hierarchy">
        {Object.entries(filteredProductsData).map(([category, products]) => {
          const isCategoryExpanded = expandedCategories.has(category);
          const selectedInCategory = products.filter(p => selectedProductsMap.has(p.pipedriveProductId)).length;
          
          return (
            <Card key={category} className="overflow-hidden shadow-sm">
              {/* Category Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
                onClick={() => toggleCategory(category)}
                data-testid={`sh-product-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCategoryExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900">{category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedInCategory > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        {selectedInCategory} selected
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {products.length} products
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Products List */}
              {isCategoryExpanded && (
                <div className="bg-white">
                  {products.map((product) => {
                    const isSelected = selectedProductsMap.has(product.pipedriveProductId);
                    const selectedItem = selectedProductsMap.get(product.pipedriveProductId);
                    
                    return (
                      <div
                        key={product.pipedriveProductId}
                        className={`p-4 border-b border-gray-50 last:border-b-0 transition-colors ${
                          isSelected ? 'bg-green-25' : 'hover:bg-gray-25'
                        }`}
                        data-testid={`sh-product-item-${product.pipedriveProductId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                              {product.code && (
                                <Badge variant="outline" className="text-xs">
                                  {product.code}
                                </Badge>
                              )}
                            </div>
                            
                            {product.shortDescription && (
                              <p className="text-sm text-gray-600 mb-2">
                                {product.shortDescription}
                              </p>
                            )}
                            
                            {product.price && (
                              <p className="text-sm font-medium text-green-600">
                                R{product.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {isSelected ? (
                              <div className="space-y-2">
                                <QuantityControl
                                  quantity={selectedItem?.quantity || 1}
                                  onQuantityChange={(qty) => handleQuantityChange(product.pipedriveProductId, qty)}
                                  productName={product.name}
                                  size="sm"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProductRemove(product.pipedriveProductId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={`sh-remove-product-${product.pipedriveProductId}`}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleProductAdd(product)}
                                className="bg-blue-600 hover:bg-blue-700"
                                data-testid={`sh-add-product-${product.pipedriveProductId}`}
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {Object.keys(filteredProductsData).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {debouncedSearchTerm ? 'No products found matching your search.' : 'No products available.'}
          </p>
          {debouncedSearchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
Manual Validation:

 Two-tier accordion works: Category → Products
 Search filters across all fields (product, category, code, description)
 Add button converts to quantity controls when selected
 Remove button works and returns to Add button state
 Quantity controls work with +/- buttons and direct input
 Selection summary shows total items and value
 Selected badge shows count in category headers
 Mobile-optimized touch targets and layout


4. Add Line Items Page Layout
Cursor Prompt:
Create the Add Line Items page with header navigation and product selection integration.

Create `/app/add-line-items/page.tsx`:

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { ProductAccordion } from '@/components/ProductAccordion';
import { LineItem } from '@/types/product';
import { useRouter } from 'next/navigation';

export default function AddLineItemsPage() {
  const [selectedProducts, setSelectedProducts] = useState<LineItem[]>([]);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingItems, setExistingItems] = useState<LineItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Get the request ID from sessionStorage
    const requestId = sessionStorage.getItem('editingRequestId');
    if (requestId) {
      setEditingRequestId(requestId);
      loadExistingLineItems(requestId);
    } else {
      // No request to edit, redirect back to main page
      router.push('/');
    }
  }, [router]);

  const loadExistingLineItems = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests?id=${requestId}`);
      const data = await response.json();
      
      if (data.ok && data.data?.[0]?.line_items) {
        const existing = data.data[0].line_items;
        setExistingItems(existing);
        setSelectedProducts(existing);
      }
    } catch (error) {
      console.error('Error loading existing line items:', error);
    }
  };

  const handleProductsChange = (products: LineItem[]) => {
    setSelectedProducts(products);
    setError(null);
  };

  const handleSaveLineItems = async () => {
    if (!editingRequestId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRequestId,
          line_items: selectedProducts
        })
      });

      const data = await response.json();

      if (data.ok) {
        // Mark for refresh on main page
        sessionStorage.setItem('shouldRefreshRequests', 'true');
        sessionStorage.removeItem('editingRequestId');
        router.push('/');
      } else {
        setError(data.message || 'Failed to save line items');
      }
    } catch (err) {
      setError('Unable to save line items. Please try again.');
      console.error('Error saving line items:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('editingRequestId');
    router.push('/');
  };

  const getTotalItems = () => selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalValue = () => selectedProducts.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const hasChanges = JSON.stringify(selectedProducts) !== JSON.stringify(existingItems);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="sh-add-line-items-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-2"
              data-testid="sh-add-line-items-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
                RTSE
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                Add Line Items
              </h1>
            </div>
          </div>
          
          {editingRequestId && (
            <p className="text-sm text-gray-600 ml-11">
              Select products and quantities for your request
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Order Summary Preview */}
        {selectedProducts.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    {selectedProducts.map((item, index) => (
                      <div key={`${item.pipedriveProductId}-${index}`} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-blue-800">
                            {item.name}
                          </span>
                          {item.code && (
                            <span className="text-xs text-blue-600 ml-2">
                              ({item.code})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-blue-700">
                          {item.quantity}x
                          {item.price && (
                            <span className="ml-1">
                              R{(item.price * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-blue-200 pt-2 space-y-1">
                    <div className="flex justify-between text-sm font-medium text-blue-900">
                      <span>Total Items:</span>
                      <span>{getTotalItems()}</span>
                    </div>
                    {getTotalValue() > 0 && (
                      <div className="flex justify-between text-sm font-medium text-blue-900">
                        <span>Total Value:</span>
                        <span>R{getTotalValue().toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Product Selection */}
        <div className="mb-6">
          <ProductAccordion
            onProductsChange={handleProductsChange}
            selectedProducts={selectedProducts}
          />
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Summary Bar */}
          {selectedProducts.length > 0 && (
            <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
              <span>{selectedProducts.length} products selected</span>
              <span>{getTotalItems()} total items</span>
              {getTotalValue() > 0 && (
                <span className="font-medium">R{getTotalValue().toFixed(2)}</span>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={saving}
              data-testid="sh-add-line-items-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLineItems}
              disabled={selectedProducts.length === 0 || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              data-testid="sh-add-line-items-save"
            >
              {saving ? 'Saving...' : `Save ${selectedProducts.length} Products`}
            </Button>
          </div>
          
          {/* Changes indicator */}
          {hasChanges && (
            <p className="text-xs text-center text-gray-500 mt-2">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      {/* Bottom Padding for Fixed Actions */}
      <div className="h-32"></div>
    </div>
  );
}
Manual Validation:

 Page renders with RTSE header and navigation
 Order summary shows selected products with quantities
 Loads existing line items when editing request
 Fixed bottom bar shows selection summary
 Save button disabled when no products selected
 Changes indicator appears when modifications made
 Navigation preserves state with sessionStorage
 Success saves and returns to main page


5. Enhanced RequestCard for Line Items Display
Cursor Prompt:
Update the RequestCard component to display line items with inline quantity controls and deletion capabilities.

Update `/app/components/RequestCard.tsx` to enhance line items section:

// Add to imports
import { QuantityControl } from '@/components/QuantityControl';
import { Trash2 } from 'lucide-react';

// Enhanced Line Items Section - replace existing line items section with:
{/* Enhanced Line Items Section */}
<div className="mb-4">
  {request.line_items.length > 0 ? (
    <div className="space-y-2" data-testid="sh-request-items-display">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900">
            Line Items ({request.line_items.length})
          </span>
        </div>
        {!isSubmitted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={()RetryJContinueEditonClick={() => onAddLineItems(request.id)}
           className="text-green-700 hover:text-green-900 text-sm"
           data-testid="sh-request-edit-items"
         >
           Edit Items
         </Button>
       )}
     </div>

     {/* Line Items List */}
     <div className="space-y-3">
       {request.line_items.map((item, index) => (
         <div 
           key={`${item.pipedriveProductId}-${index}`}
           className="bg-green-50 border border-green-200 rounded-lg p-3"
         >
           <div className="flex items-start justify-between gap-3">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <span className="font-medium text-green-900">{item.name}</span>
                 {item.code && (
                   <Badge variant="outline" className="text-xs bg-white">
                     {item.code}
                   </Badge>
                 )}
               </div>
               
               {item.shortDescription && (
                 <p className="text-sm text-green-700 mb-2">
                   {item.shortDescription}
                 </p>
               )}
               
               <div className="flex items-center gap-4 text-sm text-green-800">
                 <span>Qty: {item.quantity}</span>
                 {item.price && (
                   <>
                     <span>Unit: R{item.price.toFixed(2)}</span>
                     <span className="font-medium">
                       Total: R{(item.price * item.quantity).toFixed(2)}
                     </span>
                   </>
                 )}
               </div>
             </div>

             {/* Inline Quantity Controls for Draft Status */}
             {!isSubmitted && (
               <div className="flex flex-col items-end gap-2">
                 <QuantityControl
                   quantity={item.quantity}
                   onQuantityChange={(newQty) => handleQuantityChange(index, newQty)}
                   productName={item.name}
                   size="sm"
                 />
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleDeleteLineItem(index)}
                   className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                   data-testid={`sh-delete-line-item-${index}`}
                 >
                   <Trash2 className="h-3 w-3" />
                 </Button>
               </div>
             )}
           </div>
         </div>
       ))}
     </div>

     {/* Order Total */}
     {request.line_items.some(item => item.price) && (
       <div className="mt-3 p-2 bg-green-100 rounded text-right">
         <span className="text-sm font-medium text-green-900">
           Order Total: R{request.line_items.reduce((sum, item) => 
             sum + (item.price || 0) * item.quantity, 0
           ).toFixed(2)}
         </span>
       </div>
     )}
   </div>
 ) : (
   <Button
     variant="outline"
     className="w-full border-green-200 text-green-700 hover:bg-green-50"
     onClick={() => onAddLineItems(request.id)}
     disabled={isSubmitted}
     data-testid="sh-request-add-items"
   >
     <Package className="h-4 w-4 mr-2" />
     Add Line Items
   </Button>
 )}
</div>

// Add these handler functions to RequestCard component:
const handleQuantityChange = async (itemIndex: number, newQuantity: number) => {
 const updatedItems = [...request.line_items];
 updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQuantity };
 
 await onUpdateInline(request.id, 'line_items', updatedItems);
};

const handleDeleteLineItem = async (itemIndex: number) => {
 const updatedItems = request.line_items.filter((_, index) => index !== itemIndex);
 await onUpdateInline(request.id, 'line_items', updatedItems);
};

// Update RequestCardProps interface to include onUpdateInline:
interface RequestCardProps {
 request: Request;
 onAddContact: (requestId: string) => void;
 onAddLineItems: (requestId: string) => void;
 onAddComment: (requestId: string) => void;
 onSubmit: (requestId: string) => Promise<void>;
 onUpdateInline: (requestId: string, field: string, value: any) => Promise<void>; // Add this line
}
Manual Validation:

 Line items display with enhanced styling and layout
 Quantity controls work inline for draft requests
 Delete buttons remove individual line items
 Edit Items button navigates to line items page
 Order total calculates and displays correctly
 Controls disabled for submitted requests
 Badge displays product codes when available
 Responsive layout works on mobile devices


6. Main Page Integration Updates
Cursor Prompt:
Update the main page to properly handle the Add Line Items workflow with inline editing capabilities.

Update `/app/page.tsx` to add inline update handler and enhance line items integration:

// Add the inline update handler function to the main page component:
const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: requestId, 
        [field]: value 
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Update the specific request in state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, [field]: value, updated_at: new Date().toISOString() }
          : req
      ));
    } else {
      console.error('Failed to update request:', data.message);
    }
  } catch (error) {
    console.error('Error updating request:', error);
  }
};

// Update the RequestCard component usage to include onUpdateInline:
{requests.map(request => (
  <RequestCard
    key={request.id}
    request={request}
    onAddContact={handleAddContact}
    onAddLineItems={handleAddLineItems}
    onAddComment={handleAddComment}
    onSubmit={handleSubmitRequest}
    onUpdateInline={handleInlineUpdate} // Add this prop
  />
))}

// Enhance the handleAddLineItems function to store current items:
const handleAddLineItems = (requestId: string) => {
  sessionStorage.setItem('editingRequestId', requestId);
  
  // Store current line items for comparison
  const request = requests.find(r => r.id === requestId);
  if (request?.line_items) {
    sessionStorage.setItem('originalLineItems', JSON.stringify(request.line_items));
  }
  
  router.push('/add-line-items');
};

// Add effect to handle returning from line items page with refresh detection:
useEffect(() => {
  // Check if we should refresh (coming back from editing)
  const shouldRefresh = sessionStorage.getItem('shouldRefreshRequests');
  if (shouldRefresh) {
    sessionStorage.removeItem('shouldRefreshRequests');
    sessionStorage.removeItem('originalLineItems');
    fetchRequests();
  }
}, []);

// Add a visual indicator for recently updated requests:
const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

// Update the inline handler to track recent updates:
const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: requestId, 
        [field]: value 
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Update the specific request in state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, [field]: value, updated_at: new Date().toISOString() }
          : req
      ));
      
      // Mark as recently updated
      setRecentlyUpdated(prev => new Set(prev).add(requestId));
      
      // Remove the indicator after 3 seconds
      setTimeout(() => {
        setRecentlyUpdated(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }, 3000);
      
    } else {
      console.error('Failed to update request:', data.message);
    }
  } catch (error) {
    console.error('Error updating request:', error);
  }
};

// Update RequestCard to show recently updated indicator:
{requests.map(request => (
  <div key={request.id} className="relative">
    {recentlyUpdated.has(request.id) && (
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-green-500 text-white text-xs animate-pulse">
          Updated
        </Badge>
      </div>
    )}
    <RequestCard
      request={request}
      onAddContact={handleAddContact}
      onAddLineItems={handleAddLineItems}
      onAddComment={handleAddComment}
      onSubmit={handleSubmitRequest}
      onUpdateInline={handleInlineUpdate}
    />
  </div>
))}
Manual Validation:

 Inline quantity changes update immediately in main page
 Delete line item removes item from request card
 Recently updated indicator appears and fades after changes
 Navigation to line items page preserves editing context
 Return from line items page refreshes main page data
 Original line items stored for change detection
 Error handling works for failed inline updates


7. Accessibility and Keyboard Navigation
Cursor Prompt:
Add comprehensive accessibility features for the Add Line Items functionality.

Update ProductAccordion with accessibility improvements:

// Add keyboard navigation handler to ProductAccordion.tsx:
const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  action: () => void,
  type: 'category' | 'product' | 'quantity'
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
  
  // Arrow key navigation for products within category
  if (type === 'product' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    const productElements = document.querySelectorAll('[data-testid^="sh-product-item-"]');
    const currentIndex = Array.from(productElements).findIndex(el => 
      el.contains(event.target as Node)
    );
    
    if (currentIndex !== -1) {
      const nextIndex = event.key === 'ArrowDown' 
        ? Math.min(currentIndex + 1, productElements.length - 1)
        : Math.max(currentIndex - 1, 0);
      
      const nextElement = productElements[nextIndex] as HTMLElement;
      const addButton = nextElement.querySelector('[data-testid^="sh-add-product-"]') as HTMLElement;
      addButton?.focus();
    }
  }
};

// Update Category headers with accessibility:
<div
  className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
  onClick={() => toggleCategory(category)}
  onKeyDown={(e) => handleKeyboardNavigation(e, () => toggleCategory(category), 'category')}
  tabIndex={0}
  role="button"
  aria-expanded={isCategoryExpanded}
  aria-controls={`category-${category.replace(/\s+/g, '-')}`}
  aria-label={`${isCategoryExpanded ? 'Collapse' : 'Expand'} ${category} category with ${products.length} products`}
  data-testid={`sh-product-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
>

// Update Product items with accessibility:
<div
  className={`p-4 border-b border-gray-50 last:border-b-0 transition-colors ${
    isSelected ? 'bg-green-25' : 'hover:bg-gray-25'
  }`}
  data-testid={`sh-product-item-${product.pipedriveProductId}`}
  role="listitem"
  aria-label={`${product.name}${product.code ? `, code ${product.code}` : ''}${product.price ? `, price R${product.price}` : ''}`}
>
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1" id={`product-${product.pipedriveProductId}-info`}>
      {/* Product details */}
    </div>
    
    <div className="flex flex-col items-end gap-2">
      {isSelected ? (
        <div className="space-y-2" role="group" aria-labelledby={`product-${product.pipedriveProductId}-info`}>
          <div aria-label={`Quantity controls for ${product.name}`}>
            <QuantityControl
              quantity={selectedItem?.quantity || 1}
              onQuantityChange={(qty) => handleQuantityChange(product.pipedriveProductId, qty)}
              productName={product.name}
              size="sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleProductRemove(product.pipedriveProductId)}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => handleProductRemove(product.pipedriveProductId), 'product')}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label={`Remove ${product.name} from selection`}
            data-testid={`sh-remove-product-${product.pipedriveProductId}`}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => handleProductAdd(product)}
          onKeyDown={(e) => handleKeyboardNavigation(e, () => handleProductAdd(product), 'product')}
          className="bg-blue-600 hover:bg-blue-700"
          aria-label={`Add ${product.name} to selection${product.price ? ` for R${product.price}` : ''}`}
          data-testid={`sh-add-product-${product.pipedriveProductId}`}
        >
          Add
        </Button>
      )}
    </div>
  </div>
</div>

// Add screen reader announcements:
const [announcement, setAnnouncement] = useState('');

const announceToScreenReader = (message: string) => {
  setAnnouncement(message);
  setTimeout(() => setAnnouncement(''), 1000);
};

// Update product addition to announce:
const handleProductAdd = (product: Product) => {
  const newLineItem: LineItem = {
    pipedriveProductId: product.pipedriveProductId,
    name: product.name,
    code: product.code,
    price: product.price,
    quantity: 1,
    shortDescription: product.shortDescription
  };

  const updatedProducts = [...selectedProducts, newLineItem];
  onProductsChange(updatedProducts);
  
  announceToScreenReader(`Added ${product.name} to selection. Quantity: 1`);
};

// Update quantity change to announce:
const handleQuantityChange = (productId: number, newQuantity: number) => {
  const product = selectedProducts.find(p => p.pipedriveProductId === productId);
  const updatedProducts = selectedProducts.map(item =>
    item.pipedriveProductId === productId 
      ? { ...item, quantity: newQuantity }
      : item
  );
  onProductsChange(updatedProducts);
  
  if (product) {
    announceToScreenReader(`Changed ${product.name} quantity to ${newQuantity}`);
  }
};

// Add live region for announcements:
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
  data-testid="sh-screen-reader-announcements"
>
  {announcement}
</div>

// Update QuantityControl component with better accessibility:
// In QuantityControl.tsx, enhance the accessibility:

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  size = 'md',
  disabled = false,
  productName = 'product'
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());
  
  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleInputChange = (value: string) => {
    setLocalQuantity(value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(localQuantity, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onQuantityChange(numValue);
    } else {
      setLocalQuantity(quantity.toString()); // Reset to valid value
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div 
      className="flex items-center gap-2"
      role="group"
      aria-label={`Quantity control for ${productName}`}
      data-testid={`sh-quantity-control-${productName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 active:bg-red-100`}
        aria-label={`Decrease ${productName} quantity from ${quantity} to ${Math.max(min, quantity - 1)}`}
        data-testid="sh-quantity-decrease"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center">
        <input
          type="number"
          value={localQuantity}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          disabled={disabled}
          className={`${classes.input} ${classes.text} border border-gray-300 rounded text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          aria-label={`Quantity of ${productName}, current value ${quantity}, minimum ${min}, maximum ${max}`}
          aria-describedby={`qty-help-${productName.replace(/\s+/g, '-')}`}
          data-testid="sh-quantity-input"
        />
        <span 
          id={`qty-help-${productName.replace(/\s+/g, '-')}`}
          className="text-xs text-gray-500 mt-1"
        >
          Qty
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 active:bg-green-100`}
        aria-label={`Increase ${productName} quantity from ${quantity} to ${Math.min(max, quantity + 1)}`}
        data-testid="sh-quantity-increase"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
Manual Validation:

 All interactive elements accessible via keyboard
 Screen reader announces product additions and quantity changes
 ARIA labels provide context for all controls
 Tab order follows logical flow through categories and products
 Arrow keys navigate between products in same category
 Quantity controls work with keyboard input
 Focus management preserves context during interactions
 High contrast mode maintains visibility and usability


8. Testing Implementation
Cursor Prompt:
Create comprehensive tests for the Add Line Items functionality.

Create `/app/__tests__/add-line-items.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AddLineItemsPage from '@/app/add-line-items/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockProductsData = {
  'Safety Equipment': [
    {
      pipedriveProductId: 1,
      name: 'Safety Helmet',
      code: 'SH-001',
      price: 150,
      shortDescription: 'Industrial safety helmet'
    },
    {
      pipedriveProductId: 2,
      name: 'Safety Vest',
      code: 'SV-001',
      price: 75,
      shortDescription: 'High-visibility safety vest'
    }
  ],
  'Tools': [
    {
      pipedriveProductId: 3,
      name: 'Drill Bit Set',
      code: 'DB-001',
      price: 200,
      shortDescription: 'Professional drill bit set'
    }
  ]
};

describe('AddLineItemsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Mock successful products API
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockProductsData,
        stale: false,
        source: 'cache'
      })
    });

    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn((key) => 
      key === 'editingRequestId' ? 'test-request-id' : null
    );
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  it('renders page with correct header and navigation', async () => {
    render(<AddLineItemsPage />);

    expect(screen.getByText('Add Line Items')).toBeInTheDocument();
    expect(screen.getByTestId('sh-add-line-items-back')).toBeInTheDocument();
    expect(screen.getByText('RTSE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('sh-product-accordion')).toBeInTheDocument();
    });
  });

  it('loads and displays products in categories', async () => {
    render(<AddLineItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    // Expand safety equipment category
    fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));

    await waitFor(() => {
      expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
      expect(screen.getByText('Safety Vest')).toBeInTheDocument();
    });
  });

  it('handles product selection and quantity controls', async () => {
    render(<AddLineItemsPage />);

    // Wait for products to load and expand category
    await waitFor(() => {
      expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));

    await waitFor(() => {
      expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
    });

    // Add product
    fireEvent.click(screen.getByTestId('sh-add-product-1'));

    // Verify product appears in summary
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
    });

    // Test quantity controls
    const increaseButton = screen.getByTestId('sh-quantity-increase');
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });
  });

  it('handles multiple product selection', async () => {
    render(<AddLineItemsPage />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
    });

    await waitFor(() => {
      // Add multiple products
      fireEvent.click(screen.getByTestId('sh-add-product-1'));
      fireEvent.click(screen.getByTestId('sh-add-product-2'));
    });

    // Verify both products in summary
    await waitFor(() => {
      expect(screen.getByText('Selected Products (2)')).toBeInTheDocument();
      expect(screen.getByText('2 products selected')).toBeInTheDocument();
    });
  });

  it('calculates totals correctly', async () => {
    render(<AddLineItemsPage />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-add-product-1')); // Safety Helmet R150
    });

    // Increase quantity to 2
    await waitFor(() => {
      const increaseButton = screen.getByTestId('sh-quantity-increase');
      fireEvent.click(increaseButton);
    });

    // Check total calculation (2 × R150 = R300)
    await waitFor(() => {
      expect(screen.getByText('R300.00')).toBeInTheDocument();
      expect(screen.getByText('2 total items')).toBeInTheDocument();
    });
  });

  it('handles product removal', async () => {
    render(<AddLineItemsPage />);

    // Add a product first
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-add-product-1'));
    });

    // Remove the product
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-remove-product-1'));
    });

    // Verify product removed from summary
    await waitFor(() => {
      expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
    });
  });

  it('handles save functionality', async () => {
    render(<AddLineItemsPage />);

    // Add a product
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-add-product-1'));
    });

    // Mock successful save
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: {} })
    });

    // Click save
    const saveButton = screen.getByTestId('sh-add-line-items-save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-request-id',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              pipedriveProductId: 1,
              name: 'Safety Helmet',
              quantity: 1
            })
          ])
        })
      });
    });

    // Should navigate back to main page
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles search functionality', async () => {
    render(<AddLineItemsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('sh-product-search')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('sh-product-search');
    fireEvent.change(searchInput, { target: { value: 'helmet' } });

    expect(searchInput).toHaveValue('helmet');
  });

  it('loads existing line items when editing', async () => {
    // Mock API response with existing line items
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          data: [{
            line_items: [
              {
                pipedriveProductId: 1,
                name: 'Safety Helmet',
                quantity: 2,
                price: 150
              }
            ]
          }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          data: mockProductsData,
          stale: false
        })
      });

    render(<AddLineItemsPage />);

    // Should show existing item in summary
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });
  });
});

Create `/app/__tests__/quantity-control.test.tsx`:

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityControl } from '@/components/QuantityControl';

describe('QuantityControl', () => {
  const mockOnQuantityChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial quantity', () => {
    render(
      <QuantityControl
        quantity={5}
        onQuantityChange={mockOnQuantityChange}
        productName="Test Product"
      />
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity of Test Product/)).toBeInTheDocument();
  });

  it('handles increase button click', () => {
    render(
      <QuantityControl
        quantity={3}
        onQuantityChange={mockOnQuantityChange}
        productName="Test Product"
      />
    );RetryJContinueEdittsx   const increaseButton = screen.getByTestId('sh-quantity-increase');
   fireEvent.click(increaseButton);

   expect(mockOnQuantityChange).toHaveBeenCalledWith(4);
 });

 it('handles decrease button click', () => {
   render(
     <QuantityControl
       quantity={3}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
     />
   );

   const decreaseButton = screen.getByTestId('sh-quantity-decrease');
   fireEvent.click(decreaseButton);

   expect(mockOnQuantityChange).toHaveBeenCalledWith(2);
 });

 it('disables decrease button at minimum', () => {
   render(
     <QuantityControl
       quantity={1}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
       min={1}
     />
   );

   const decreaseButton = screen.getByTestId('sh-quantity-decrease');
   expect(decreaseButton).toBeDisabled();
 });

 it('disables increase button at maximum', () => {
   render(
     <QuantityControl
       quantity={10}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
       max={10}
     />
   );

   const increaseButton = screen.getByTestId('sh-quantity-increase');
   expect(increaseButton).toBeDisabled();
 });

 it('handles direct input', () => {
   render(
     <QuantityControl
       quantity={3}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
     />
   );

   const input = screen.getByTestId('sh-quantity-input');
   fireEvent.change(input, { target: { value: '7' } });
   fireEvent.blur(input);

   expect(mockOnQuantityChange).toHaveBeenCalledWith(7);
 });

 it('validates input range and resets invalid values', () => {
   render(
     <QuantityControl
       quantity={3}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
       min={1}
       max={10}
     />
   );

   const input = screen.getByTestId('sh-quantity-input');
   
   // Test value above maximum
   fireEvent.change(input, { target: { value: '15' } });
   fireEvent.blur(input);

   // Should reset to original value
   expect(input).toHaveValue(3);
   expect(mockOnQuantityChange).not.toHaveBeenCalled();
 });

 it('handles keyboard navigation', () => {
   render(
     <QuantityControl
       quantity={3}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
     />
   );

   const input = screen.getByTestId('sh-quantity-input');
   fireEvent.change(input, { target: { value: '5' } });
   fireEvent.keyDown(input, { key: 'Enter' });

   expect(mockOnQuantityChange).toHaveBeenCalledWith(5);
 });

 it('renders different sizes correctly', () => {
   const { rerender } = render(
     <QuantityControl
       quantity={1}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
       size="sm"
     />
   );

   let increaseButton = screen.getByTestId('sh-quantity-increase');
   expect(increaseButton).toHaveClass('h-8', 'w-8');

   rerender(
     <QuantityControl
       quantity={1}
       onQuantityChange={mockOnQuantityChange}
       productName="Test Product"
       size="lg"
     />
   );

   increaseButton = screen.getByTestId('sh-quantity-increase');
   expect(increaseButton).toHaveClass('h-12', 'w-12');
 });

 it('provides proper accessibility labels', () => {
   render(
     <QuantityControl
       quantity={3}
       onQuantityChange={mockOnQuantityChange}
       productName="Safety Helmet"
     />
   );

   expect(screen.getByLabelText(/Decrease Safety Helmet quantity from 3 to 2/)).toBeInTheDocument();
   expect(screen.getByLabelText(/Increase Safety Helmet quantity from 3 to 4/)).toBeInTheDocument();
   expect(screen.getByLabelText(/Quantity of Safety Helmet, current value 3/)).toBeInTheDocument();
 });
});

Create `/app/__tests__/product-accordion.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductAccordion } from '@/components/ProductAccordion';

const mockProductsData = {
 'Safety Equipment': [
   {
     pipedriveProductId: 1,
     name: 'Safety Helmet',
     code: 'SH-001',
     price: 150,
     shortDescription: 'Industrial safety helmet'
   }
 ],
 'Tools': [
   {
     pipedriveProductId: 2,
     name: 'Drill Bit Set',
     code: 'DB-001',
     price: 200,
     shortDescription: 'Professional drill bit set'
   }
 ]
};

global.fetch = jest.fn();

describe('ProductAccordion', () => {
 const mockOnProductsChange = jest.fn();

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

 it('renders loading state initially', () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );
   
   expect(screen.getByTestId('sh-products-loading')).toBeInTheDocument();
   expect(screen.getByText('Loading products...')).toBeInTheDocument();
 });

 it('displays product categories after loading', async () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   await waitFor(() => {
     expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
     expect(screen.getByText('Tools')).toBeInTheDocument();
     expect(screen.getByText('1 products')).toBeInTheDocument();
   });
 });

 it('expands and collapses categories', async () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   await waitFor(() => {
     expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
   });

   // Initially products should not be visible
   expect(screen.queryByText('Safety Helmet')).not.toBeInTheDocument();

   // Expand category
   fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));

   await waitFor(() => {
     expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
   });

   // Collapse category
   fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));

   await waitFor(() => {
     expect(screen.queryByText('Safety Helmet')).not.toBeInTheDocument();
   });
 });

 it('handles product selection', async () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   // Expand category and add product
   await waitFor(() => {
     fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
   });

   await waitFor(() => {
     expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
   });

   fireEvent.click(screen.getByTestId('sh-add-product-1'));

   expect(mockOnProductsChange).toHaveBeenCalledWith([
     expect.objectContaining({
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 1,
       price: 150
     })
   ]);
 });

 it('displays selected products in summary', async () => {
   const selectedProducts = [
     {
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 2,
       price: 150,
       code: 'SH-001',
       shortDescription: 'Industrial safety helmet'
     }
   ];

   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={selectedProducts}
     />
   );

   await waitFor(() => {
     expect(screen.getByText('Selected Products (1)')).toBeInTheDocument();
     expect(screen.getByText('Total Items: 2')).toBeInTheDocument();
     expect(screen.getByText('Total Value: R300.00')).toBeInTheDocument();
   });
 });

 it('handles quantity changes', async () => {
   const selectedProducts = [
     {
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 1,
       price: 150,
       code: 'SH-001',
       shortDescription: 'Industrial safety helmet'
     }
   ];

   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={selectedProducts}
     />
   );

   // Expand category to see quantity controls
   await waitFor(() => {
     fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
   });

   await waitFor(() => {
     const increaseButton = screen.getByTestId('sh-quantity-increase');
     fireEvent.click(increaseButton);
   });

   expect(mockOnProductsChange).toHaveBeenCalledWith([
     expect.objectContaining({
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 2,
       price: 150
     })
   ]);
 });

 it('handles product removal', async () => {
   const selectedProducts = [
     {
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 1,
       price: 150,
       code: 'SH-001',
       shortDescription: 'Industrial safety helmet'
     }
   ];

   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={selectedProducts}
     />
   );

   await waitFor(() => {
     fireEvent.click(screen.getByTestId('sh-product-category-safety-equipment'));
   });

   await waitFor(() => {
     fireEvent.click(screen.getByTestId('sh-remove-product-1'));
   });

   expect(mockOnProductsChange).toHaveBeenCalledWith([]);
 });

 it('filters products based on search', async () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   await waitFor(() => {
     expect(screen.getByTestId('sh-product-search')).toBeInTheDocument();
   });

   // Search for helmet
   const searchInput = screen.getByTestId('sh-product-search');
   fireEvent.change(searchInput, { target: { value: 'helmet' } });

   // Should still show safety equipment category
   await waitFor(() => {
     expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
     // Tools category should not appear in filtered results
     expect(screen.queryByText('Tools')).not.toBeInTheDocument();
   });
 });

 it('displays stale data warning', async () => {
   (fetch as jest.Mock).mockResolvedValueOnce({
     ok: true,
     json: () => Promise.resolve({
       ok: true,
       data: mockProductsData,
       stale: true
     })
   });

   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   await waitFor(() => {
     expect(screen.getByText(/Using offline data/)).toBeInTheDocument();
   });
 });

 it('shows selected count in category headers', async () => {
   const selectedProducts = [
     {
       pipedriveProductId: 1,
       name: 'Safety Helmet',
       quantity: 1,
       price: 150,
       code: 'SH-001',
       shortDescription: 'Industrial safety helmet'
     }
   ];

   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={selectedProducts}
     />
   );

   await waitFor(() => {
     expect(screen.getByText('1 selected')).toBeInTheDocument();
   });
 });

 it('handles keyboard navigation', async () => {
   render(
     <ProductAccordion 
       onProductsChange={mockOnProductsChange}
       selectedProducts={[]}
     />
   );

   await waitFor(() => {
     expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
   });

   const categoryButton = screen.getByTestId('sh-product-category-safety-equipment');
   
   // Test Enter key
   fireEvent.keyDown(categoryButton, { key: 'Enter' });
   
   await waitFor(() => {
     expect(screen.getByText('Safety Helmet')).toBeInTheDocument();
   });
 });
});
Manual Validation:

 All tests pass with npm test
 Product selection and removal work correctly
 Quantity controls function properly in tests
 Search functionality filters products accurately
 Selection summary calculations are correct
 Category expansion/collapse works as expected
 Keyboard navigation tests verify accessibility
 Error states and edge cases are covered
 Performance with large product lists is acceptable


Summary
This comprehensive Add Line Items implementation provides:

Reusable accordion component adapted from Add Contacts with 2-tier structure (Category → Products)
Robust quantity controls with jumbo +/- buttons, direct input, and mobile optimization
Multi-product selection with real-time summary and total calculations
Inline editing capabilities from the main page RequestCard component
Comprehensive accessibility including keyboard navigation and screen reader support
Performance optimizations with debounced search and efficient state management
Full test coverage including unit, integration, and accessibility testing
Seamless navigation with sessionStorage state preservation and refresh detection

The implementation follows the same design patterns as the Add Contacts feature while being optimized for the specific requirements of product selection with quantities. It integrates seamlessly with the main page and provides a complete line items management workflow.