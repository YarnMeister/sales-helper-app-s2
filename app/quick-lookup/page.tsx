'use client';

import React, { useState } from 'react';
import { ContactAccordion } from '../components/ContactAccordion';
import { ProductAccordion } from '../components/ProductAccordion';
import { useRouter } from 'next/navigation';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';
import { Button } from '../components/ui/button';

export default function QuickLookupPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden" style={{ width: '100vw', maxWidth: '100vw', boxSizing: 'border-box' }}>
      {/* Common Header */}
      <CommonHeader title="Quick Lookup" />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24 w-full max-w-full overflow-x-hidden" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Tab Selectors */}
        <div className="mb-4">
          <div className="flex gap-2 w-[90%] max-w-[90%] mx-auto">
            <Button
              variant={selectedTab === 'contacts' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 ${selectedTab === 'contacts' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              onClick={() => setSelectedTab('contacts')}
            >
              Contacts
            </Button>
            <Button
              variant={selectedTab === 'price-list' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 ${selectedTab === 'price-list' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              onClick={() => setSelectedTab('price-list')}
            >
              Price List
            </Button>
          </div>
        </div>
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

      {/* Common Footer */}
      <CommonFooter 
        onNewRequest={() => {}} 
        isCreating={false}
      />
    </div>
  );
}
