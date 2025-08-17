'use client';

import React from 'react';
import { ContactAccordion } from '../components/ContactAccordion';
import { useRouter } from 'next/navigation';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';

export default function ContactsListPage() {
  const router = useRouter();

  // Dummy function for view-only mode
  const handleContactView = (contact: any) => {
    // In view-only mode, we don't do anything when a contact is clicked
    console.log('Viewing contact:', contact.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Contacts" />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        <ContactAccordion
          onSelectContact={handleContactView}
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
