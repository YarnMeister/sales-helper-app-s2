'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ContactAccordion } from '../components/ContactAccordion';
import { Contact } from '../types/contact';
import { useRouter } from 'next/navigation';
import { CommonFooter } from '../components/CommonFooter';
import { CacheRefreshButton } from '../components/CacheRefreshButton';

export default function AddContactPage() {
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentContactInfo, setCurrentContactInfo] = useState<{
    name: string;
    mineGroup: string;
    mineName: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get the request ID from sessionStorage
    const requestId = sessionStorage.getItem('editingRequestId');
    if (requestId) {
      setEditingRequestId(requestId);
      
      // Get current contact info from sessionStorage
      const contactInfoStr = sessionStorage.getItem('currentContactInfo');
      if (contactInfoStr) {
        try {
          const contactInfo = JSON.parse(contactInfoStr);
          setCurrentContactInfo(contactInfo);
        } catch (error) {
          console.error('Error parsing current contact info:', error);
        }
      }
    } else {
      // No request to edit, redirect back to main page
      router.push('/');
    }
  }, [router]);

  const handleContactSelect = async (contact: Contact) => {
    if (!editingRequestId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRequestId,
          contact: contact
        })
      });

      const data = await response.json();

      if (data.ok) {
        // Clear the editing session and return to main page
        sessionStorage.removeItem('editingRequestId');
        sessionStorage.removeItem('currentContactInfo');
        sessionStorage.setItem('shouldRefreshRequests', 'true');
        router.push('/');
      } else {
        setError(data.message || 'Failed to save contact');
        setSaving(false);
      }
    } catch (err) {
      setError('Unable to save contact. Please try again.');
      console.error('Error saving contact:', err);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('editingRequestId');
    sessionStorage.removeItem('currentContactInfo');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" data-testid="sh-add-contact-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-2"
              data-testid="sh-add-contact-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
                RTSE
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                Add Contact
              </h1>
            </div>
            <div className="ml-auto">
              <CacheRefreshButton />
            </div>
          </div>
          
          {editingRequestId && (
            <p className="text-sm text-gray-600 ml-11">
              Select a contact for your request
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
              <p className="text-gray-600 text-center">Saving contact...</p>
            </div>
          </div>
        )}

        {/* Current Contact Display */}
        {currentContactInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Currently Selected Contact</h3>
            <div className="text-sm text-blue-800">
              <p className="font-medium">{currentContactInfo.name}</p>
              <p className="text-blue-600">
                {currentContactInfo.mineGroup} | {currentContactInfo.mineName}
              </p>
            </div>
          </div>
        )}

        {/* Contact Selection */}
        <div className="mb-6">
          <ContactAccordion
            onSelectContact={handleContactSelect}
          />
        </div>
      </div>

      {/* Common Footer */}
      <CommonFooter />
    </div>
  );
}

