'use client';

import React, { useState } from 'react';
import { ContactAccordion } from '../components/ContactAccordion';
import { ProductAccordion } from '../components/ProductAccordion';
import { BottomNavigation } from '../components/BottomNavigation';

export default function QuickLookupPage() {
  const [selectedTab, setSelectedTab] = useState<'contacts' | 'price-list'>('contacts');

  // Dummy function for view-only mode
  const handleContactView = (contact: any) => {
    // In view-only mode, we don't do anything when a contact is clicked
    console.log('Viewing contact:', contact.name);
  };

  const handleProductView = (product: any) => {
    // In view-only mode, we don't do anything when a product is clicked
    console.log('Viewing product:', product.name);
  };

    return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
              RTSE
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Lookup
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {selectedTab === 'contacts' ? (
          <ContactAccordion
            onSelectContact={handleContactView}
            className="view-only"
            viewOnly={true}
          />
        ) : (
          <ProductAccordion
            onProductSelect={handleProductView}
            existingItems={[]}
            className="view-only"
            viewOnly={true}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
