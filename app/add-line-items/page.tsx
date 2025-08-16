'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProductAccordion } from '../components/ProductAccordion';
import { LineItem } from '../types/product';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '../components/BottomNavigation';

export default function AddLineItemsPage() {
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingItems, setExistingItems] = useState<LineItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Get the request ID from sessionStorage
    const requestId = sessionStorage.getItem('editingRequestId');
    console.log('add-line-items page loaded, editingRequestId from sessionStorage:', requestId);
    
    if (requestId) {
      setEditingRequestId(requestId);
      console.log('Set editingRequestId state to:', requestId);
      loadExistingLineItems(requestId);
    } else {
      console.error('No editingRequestId found in sessionStorage, redirecting to main page');
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
      }
    } catch (error) {
      console.error('Error loading existing line items:', error);
    }
  };

  const handleProductSelect = async (product: LineItem) => {
    console.log('handleProductSelect called with:', { product, editingRequestId, existingItems });
    
    if (!editingRequestId) {
      console.error('No editingRequestId found');
      setError('No request ID found. Please go back and try again.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Add the new product to existing items
      const updatedLineItems = [...existingItems, product];
      console.log('Updated line items:', updatedLineItems);

      const requestBody = {
        id: editingRequestId,
        line_items: updatedLineItems
      };
      console.log('Sending API request with body:', requestBody);

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (data.ok) {
        console.log('Line item saved successfully');
        // Mark for refresh on main page
        sessionStorage.setItem('shouldRefreshRequests', 'true');
        sessionStorage.removeItem('editingRequestId');
        router.push('/');
      } else {
        console.error('API returned error:', data);
        setError(data.message || 'Failed to save line item');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error saving line item:', err);
      setError('Unable to save line item. Please try again.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('editingRequestId');
    router.push('/');
  };

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
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Saving line item...</p>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="mb-6">
          <ProductAccordion
            onProductSelect={handleProductSelect}
            existingItems={existingItems}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

