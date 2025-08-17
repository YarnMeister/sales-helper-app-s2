'use client';

import React from 'react';
import { ContactAccordion } from '../components/ContactAccordion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/navigation';

export default function ContactsListPage() {
  const router = useRouter();

  // Dummy function for view-only mode
  const handleContactView = (contact: any) => {
    // In view-only mode, we don't do anything when a contact is clicked
    console.log('Viewing contact:', contact.name);
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
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        <ContactAccordion
          onSelectContact={handleContactView}
          className="view-only"
          viewOnly={true}
        />
      </div>
    </div>
  );
}
