'use client';

import React from 'react';
import { ProductAccordion } from '../components/ProductAccordion';
import { useRouter } from 'next/navigation';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';

export default function PriceListPage() {
  const router = useRouter();

  // Dummy function for view-only mode
  const handleProductView = (product: any) => {
    // In view-only mode, we don't do anything when a product is clicked
    console.log('Viewing product:', product.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Price List" />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        <ProductAccordion
          onProductSelect={handleProductView}
          existingItems={[]}
          className="view-only"
          viewOnly={true}
        />
      </div>

      {/* Common Footer */}
      <CommonFooter 
        onNewRequest={() => {}} 
        isCreating={false}
      />
    </div>
  );
}
