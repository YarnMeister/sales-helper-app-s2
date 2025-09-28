'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProductAccordion } from '../components/ProductAccordion';
import { LineItem } from '../../types/features/sales-requests';
import { useRouter } from 'next/navigation';
import { CommonFooter } from '../components/CommonFooter';
import { CacheRefreshButton } from '../components/CacheRefreshButton';

export default function AddLineItemsPage() {
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLineItemsInfo, setCurrentLineItemsInfo] = useState<{
    code: string;
    name: string;
    description: string;
    quantity: number;
  }[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Get the request ID from sessionStorage
    const requestId = sessionStorage.getItem('editingRequestId');
    
    if (requestId) {
      setEditingRequestId(requestId);
      
      // Get current line items info from sessionStorage
      const lineItemsInfoStr = sessionStorage.getItem('currentLineItemsInfo');
      if (lineItemsInfoStr) {
        try {
          const lineItemsInfo = JSON.parse(lineItemsInfoStr);
          setCurrentLineItemsInfo(lineItemsInfo);
        } catch (error) {
          console.error('Error parsing current line items info:', error);
        }
      }
    } else {
      // No request to edit, redirect back to main page
      router.push('/');
    }
  }, [router]);

  const handleProductSelect = async (product: LineItem) => {
    if (!editingRequestId) {
      setError('No request ID found. Please go back and try again.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Use atomic line item addition to prevent race conditions
      const response = await fetch('/api/requests/line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: editingRequestId,
          lineItem: product
        })
      });

      const data = await response.json();

      if (data.ok) {
        // Clear the editing session and return to main page
        sessionStorage.removeItem('editingRequestId');
        sessionStorage.removeItem('currentLineItemsInfo');
        sessionStorage.setItem('shouldRefreshRequests', 'true');
        router.push('/');
      } else {
        setError(data.message || 'Failed to save line item');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error adding line item:', err);
      setError('Unable to save line item. Please try again.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('editingRequestId');
    sessionStorage.removeItem('currentLineItemsInfo');
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
            <div className="ml-auto">
              <CacheRefreshButton />
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
                  <div className="mb-6 p-4 bg-red-50 border border-red-600 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
        )}

        {/* Loading Overlay */}
        {saving && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-center">Saving line item...</p>
            </div>
          </div>
        )}

        {/* Current Line Items Display */}
        {currentLineItemsInfo.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Currently Selected Line Items</h3>
            <div className="space-y-2">
              {currentLineItemsInfo.map((item, index) => (
                <div key={index} className="text-sm text-blue-800 p-2 bg-blue-100 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-blue-600 text-xs">
                        Code: {item.code} | Qty: {item.quantity}
                      </p>
                      {item.description && item.description !== item.name && (
                        <p className="text-blue-600 text-xs mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="mb-6">
          <ProductAccordion
            onProductSelect={handleProductSelect}
          />
        </div>
      </div>

      {/* Common Footer */}
      <CommonFooter />
    </div>
  );
}

