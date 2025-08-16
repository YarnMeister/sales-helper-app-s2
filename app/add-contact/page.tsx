'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { ContactAccordion } from '../components/ContactAccordion';
import { Contact } from '../types/contact';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '../components/BottomNavigation';

export default function AddContactPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get the request ID from sessionStorage
    const requestId = sessionStorage.getItem('editingRequestId');
    if (requestId) {
      setEditingRequestId(requestId);
    } else {
      // No request to edit, redirect back to main page
      router.push('/');
    }
  }, [router]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setError(null);
  };

  const handleSaveContact = async () => {
    if (!selectedContact || !editingRequestId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRequestId,
          contact: selectedContact
        })
      });

      const data = await response.json();

      if (data.ok) {
        // Clear the editing session and return to main page
        sessionStorage.removeItem('editingRequestId');
        sessionStorage.setItem('shouldRefreshRequests', 'true');
        router.push('/');
      } else {
        setError(data.message || 'Failed to save contact');
      }
    } catch (err) {
      setError('Unable to save contact. Please try again.');
      console.error('Error saving contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('editingRequestId');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="sh-add-contact-page">
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
        
        {/* Selected Contact Preview */}
        {selectedContact && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {selectedContact.name}
                  </h3>
                  <p className="text-sm text-blue-700 mb-2">
                    {selectedContact.mineGroup} → {selectedContact.mineName}
                  </p>
                  
                  <div className="space-y-1">
                    {selectedContact.email && (
                      <p className="text-sm text-blue-600">
                        📧 {selectedContact.email}
                      </p>
                    )}
                    {selectedContact.phone && (
                      <p className="text-sm text-blue-600">
                        📞 {selectedContact.phone}
                      </p>
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

        {/* Contact Selection */}
        <div className="mb-6">
          <ContactAccordion
            onSelectContact={handleContactSelect}
            selectedContact={selectedContact}
          />
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto max-w-2xl flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={saving}
            data-testid="sh-add-contact-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveContact}
            disabled={!selectedContact || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            data-testid="sh-add-contact-save"
          >
            {saving ? 'Saving...' : 'Save Contact'}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

