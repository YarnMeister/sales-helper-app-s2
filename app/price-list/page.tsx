'use client';

import React from 'react';
import { ProductAccordion } from '../components/ProductAccordion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/navigation';

export default function PriceListPage() {
  const router = useRouter();

  // Dummy function for view-only mode
  const handleProductView = (product: any) => {
    // In view-only mode, we don't do anything when a product is clicked
    console.log('Viewing product:', product.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Price List</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        <ProductAccordion
          onProductSelect={handleProductView}
          existingItems={[]}
          className="view-only"
          viewOnly={true}
        />
      </div>
    </div>
  );
}
