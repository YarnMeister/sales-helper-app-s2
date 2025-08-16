'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { ProductAccordion } from '../components/ProductAccordion';
import { LineItem } from '../types/product';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '../components/BottomNavigation';

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
    <div className="min-h-screen bg-gray-50 pb-20" data-testid="sh-add-line-items-page">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

