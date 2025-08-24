Add Contact Page Implementation - Sales Helper App
Overview
Implement the Add Contact page with mobile-first accordion design, hierarchical contact selection (Mine Group → Mine Name → Contact), and seamless navigation back to main page with state persistence.

1. Contact Data Types and Interfaces
Cursor Prompt:
Create TypeScript interfaces for the hierarchical contact data structure that matches the caching API from Section 3.

Create `/app/types/contact.ts`:

export interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  mineGroup: string;
  mineName: string;
}

export interface ContactsHierarchy {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

export interface ContactsApiResponse {
  ok: boolean;
  data: ContactsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

export interface ContactSelectionState {
  expandedGroups: Set<string>;
  expandedMines: Set<string>;
  selectedContact: Contact | null;
  searchTerm: string;
}
Manual Validation:

 Interfaces match the API response structure from Section 3.3
 Contact interface includes all necessary fields for display
 Hierarchy structure supports 3-tier accordion (Group → Mine → Contact)
 State interface captures all UI interaction states


2. Contact Accordion Component
Cursor Prompt:
Create a mobile-optimized accordion component for hierarchical contact selection with search functionality.

Create `/app/components/ContactAccordion.tsx`:

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Search, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { Contact, ContactsHierarchy, ContactSelectionState } from '@/types/contact';

interface ContactAccordionProps {
  onSelectContact: (contact: Contact) => void;
  selectedContact: Contact | null;
  className?: string;
}

export const ContactAccordion: React.FC<ContactAccordionProps> = ({
  onSelectContact,
  selectedContact,
  className = ''
}) => {
  const [contactsData, setContactsData] = useState<ContactsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [state, setState] = useState<ContactSelectionState>({
    expandedGroups: new Set(),
    expandedMines: new Set(),
    selectedContact: null,
    searchTerm: ''
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/contacts');
      const data = await response.json();
      
      if (data.ok) {
        setContactsData(data.data);
        setStale(data.stale || false);
      } else {
        setError(data.message || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Unable to load contacts. Please check your connection.');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search term
  const filteredContactsData = useMemo(() => {
    if (!state.searchTerm) return contactsData;

    const searchLower = state.searchTerm.toLowerCase();
    
    return Object.entries(contactsData).reduce((acc, [group, mines]) => {
      const filteredMines = Object.entries(mines).reduce((mineAcc, [mine, contacts]) => {
        const filteredContacts = contacts.filter(contact =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          group.toLowerCase().includes(searchLower) ||
          mine.toLowerCase().includes(searchLower)
        );
        
        if (filteredContacts.length > 0) {
          mineAcc[mine] = filteredContacts;
        }
        return mineAcc;
      }, {} as { [mine: string]: Contact[] });

      if (Object.keys(filteredMines).length > 0) {
        acc[group] = filteredMines;
      }
      return acc;
    }, {} as ContactsHierarchy);
  }, [contactsData, state.searchTerm]);

  const toggleGroup = (group: string) => {
    setState(prev => {
      const newExpandedGroups = new Set(prev.expandedGroups);
      const newExpandedMines = new Set(prev.expandedMines);
      
      if (newExpandedGroups.has(group)) {
        newExpandedGroups.delete(group);
        // Also collapse all mines in this group
        Object.keys(contactsData[group] || {}).forEach(mine => {
          newExpandedMines.delete(`${group}-${mine}`);
        });
      } else {
        newExpandedGroups.add(group);
      }
      
      return {
        ...prev,
        expandedGroups: newExpandedGroups,
        expandedMines: newExpandedMines
      };
    });
  };

  const toggleMine = (group: string, mine: string) => {
    const mineKey = `${group}-${mine}`;
    setState(prev => {
      const newExpandedMines = new Set(prev.expandedMines);
      
      if (newExpandedMines.has(mineKey)) {
        newExpandedMines.delete(mineKey);
      } else {
        newExpandedMines.add(mineKey);
      }
      
      return {
        ...prev,
        expandedMines: newExpandedMines
      };
    });
  };

  const handleContactSelect = (contact: Contact) => {
    setState(prev => ({ ...prev, selectedContact: contact }));
    onSelectContact(contact);
  };

  const updateSearchTerm = (term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-contacts-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-contacts-error">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchContacts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className} data-testid="sh-contact-accordion">
      {/* Offline Warning */}
      {stale && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Using offline data. Some information may be outdated.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts, mines, or groups..."
            value={state.searchTerm}
            onChange={(e) => updateSearchTerm(e.target.value)}
            className="pl-10 text-base"
            data-testid="sh-contact-search"
          />
        </div>
      </div>

      {/* Contacts Hierarchy */}
      <div className="space-y-3" data-testid="sh-contacts-hierarchy">
        {Object.entries(filteredContactsData).map(([group, mines]) => {
          const isGroupExpanded = state.expandedGroups.has(group);
          const totalContacts = Object.values(mines).reduce((sum, contacts) => sum + contacts.length, 0);
          
          return (
            <Card key={group} className="overflow-hidden shadow-sm">
              {/* Mine Group Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
                onClick={() => toggleGroup(group)}
                data-testid={`sh-contact-group-${group.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isGroupExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <h3 className="font-semibold text-lg text-gray-900">{group}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {totalContacts} contacts
                  </Badge>
                </div>
              </div>
              
              {/* Mine Names */}
              {isGroupExpanded && (
                <div className="bg-gray-25">
                  {Object.entries(mines).map(([mine, contacts]) => {
                    const mineKey = `${group}-${mine}`;
                    const isMineExpanded = state.expandedMines.has(mineKey);
                    
                    return (
                      <div key={mine} className="border-b border-gray-100 last:border-b-0">
                        {/* Mine Name Header */}
                        <div
                          className="p-4 pl-8 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
                          onClick={() => toggleMine(group, mine)}
                          data-testid={`sh-contact-mine-${mineKey.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isMineExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-800">{mine}</h4>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {contacts.length}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Contacts List */}
                        {isMineExpanded && (
                          <div className="bg-white">
                            {contacts.map((contact) => (
                              <div
                                key={contact.personId}
                                className={`p-4 pl-12 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${
                                  selectedContact?.personId === contact.personId
                                    ? 'bg-blue-50 border-blue-100'
                                    : 'hover:bg-gray-25 active:bg-gray-50'
                                }`}
                                onClick={() => handleContactSelect(contact)}
                                data-testid={`sh-contact-person-${contact.personId}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">
                                        {contact.name}
                                      </span>
                                      {selectedContact?.personId === contact.personId && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      {contact.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Mail className="h-3 w-3" />
                                          <span>{contact.email}</span>
                                        </div>
                                      )}
                                      {contact.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Phone className="h-3 w-3" />
                                          <span>{contact.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {Object.keys(filteredContactsData).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {state.searchTerm ? 'No contacts found matching your search.' : 'No contacts available.'}
          </p>
          {state.searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => updateSearchTerm('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
Manual Validation:

 Three-tier accordion works: Mine Group → Mine Name → Contacts
 Search filters across all levels (group, mine, contact, email)
 Mobile-optimized touch targets (min 44px)
 Selected contact highlighted with check icon
 Contact details (email, phone) display clearly
 Offline/stale data warning appears when appropriate
 Loading and error states work correctly
 Smooth animations for expand/collapse


3. Add Contact Page Layout
Cursor Prompt:
Create the Add Contact page with header navigation and contact selection integration.

Create `/app/add-contact/page.tsx`:

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { ContactAccordion } from '@/components/ContactAccordion';
import { Contact } from '@/types/contact';
import { useRouter } from 'next/navigation';

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

      {/* Bottom Padding for Fixed Actions */}
      <div className="h-20"></div>
    </div>
  );
}
Manual Validation:

 Page renders as full-screen modal alternative for mobile
 Header shows RTSE logo and "Add Contact" title
 Back button returns to main page and clears sessionStorage
 Selected contact preview shows above accordion
 Fixed bottom action bar works on mobile
 Save button disabled until contact selected
 Saving state prevents double-submission
 Success navigation returns to main page with contact saved
 Error states display appropriately


4. Integration with Main Page
Cursor Prompt:
Update the main page RequestCard component to properly handle the Add Contact workflow and display saved contacts.

Update `/app/components/RequestCard.tsx` to enhance contact display:

// Add to the existing RequestCard component in the Contact Section:

{/* Enhanced Contact Section */}
<div className="mb-4">
  {request.contact ? (
    <div 
      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
      data-testid="sh-request-contact-display"
    >
      <div className="flex items-start gap-2 mb-2">
        <User className="h-4 w-4 text-blue-600 mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-blue-900">{request.contact.name}</p>
            {!isSubmitted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddContact(request.id)}
                className="text-blue-700 hover:text-blue-900 p-1"
                data-testid="sh-request-change-contact"
              >
                Change
              </Button>
            )}
          </div>
          
          {request.contact.mineGroup && request.contact.mineName && (
            <p className="text-sm text-blue-700 mb-1">
              {request.contact.mineGroup} → {request.contact.mineName}
            </p>
          )}
          
          <div className="space-y-1">
            {request.contact.email && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <span>📧</span>
                <span>{request.contact.email}</span>
              </p>
            )}
            {request.contact.phone && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <span>📞</span>
                <span>{request.contact.phone}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Button
      variant="outline"
      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
      onClick={() => onAddContact(request.id)}
      disabled={isSubmitted}
      data-testid="sh-request-add-contact"
    >
      <User className="h-4 w-4 mr-2" />
      Add Contact
    </Button>
  )}
</div>

Update the main page `/app/page.tsx` to handle returning from Add Contact:

// Add useEffect to handle returning from Add Contact page
useEffect(() => {
  // Refresh requests when returning from contact/line items pages
  const handleFocus = () => {
    const hasEditingRequest = sessionStorage.getItem('editingRequestId');
    if (!hasEditingRequest) {
      // User returned from editing, refresh the requests
      fetchRequests();
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);

// Alternative: Use a more reliable approach with router events
useEffect(() => {
  // Check if we should refresh (coming back from editing)
  const shouldRefresh = sessionStorage.getItem('shouldRefreshRequests');
  if (shouldRefresh) {
    sessionStorage.removeItem('shouldRefreshRequests');
    fetchRequests();
  }
}, []);
Manual Validation:

 Contact displays with enhanced styling when saved
 Mine Group → Mine Name hierarchy shows in contact display
 Email and phone display with appropriate icons
 "Change" button appears for existing contacts (when not submitted)
 Main page refreshes when returning from Add Contact
 SessionStorage properly manages editing state
 Contact data persists correctly in request card


5. Responsive Design and Touch Optimization
Cursor Prompt:
Add responsive design improvements and touch optimization for mobile devices.

Create `/app/styles/contact-accordion.css`:

/* Touch-optimized styles for contact accordion */
.contact-accordion {
  /* Ensure minimum touch target size */
  .accordion-button {
    min-height: 44px;
    min-width: 44px;
  }

  /* Improve touch feedback */
  .contact-item {
    -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
    tap-highlight-color: rgba(59, 130, 246, 0.1);
  }

  /* Prevent text selection during touch */
  .accordion-header {
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
  }

  /* Smooth scrolling for search results */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
  }
}

/* Custom focus styles for accessibility */
.contact-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

Update the ContactAccordion component to include CSS classes:

// Add to ContactAccordion.tsx imports
import '../styles/contact-accordion.css';

// Update the main container
<div className={`contact-accordion ${className}`} data-testid="sh-contact-accordion">

// Update touch targets with proper classes
<div
  className="accordion-button p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
  onClick={() => toggleGroup(group)}
  data-testid={`sh-contact-group-${group.replace(/\s+/g, '-').toLowerCase()}`}
>

// Update contact items
<div
  className="contact-item p-4 pl-12 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
  onClick={() => handleContactSelect(contact)}
  data-testid={`sh-contact-person-${contact.personId}`}
  tabIndex={0}
  role="button"
  aria-label={`Select ${contact.name} from ${contact.mineName}`}
>
Manual Validation:

 Touch targets are minimum 44px height/width
 Touch feedback provides visual confirmation
 Text selection disabled on accordion headers
 Smooth scrolling works on mobile browsers
 Focus states visible for keyboard navigation
 ARIA labels improve screen reader accessibility
 Active states provide appropriate visual feedback


6. Search and Performance Optimization
Cursor Prompt:
Add debounced search and performance optimizations for large contact lists.

Create `/app/hooks/useDebounce.ts`:

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

Update ContactAccordion to use debounced search:

// Add to ContactAccordion.tsx imports
import { useDebounce } from '@/hooks/useDebounce';

// Update search state management
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Update filtered data to use debounced term
const filteredContactsData = useMemo(() => {
  if (!debouncedSearchTerm) return contactsData;

  const searchLower = debouncedSearchTerm.toLowerCase();
  // ... rest of filtering logic
}, [contactsData, debouncedSearchTerm]);

// Update search input
<Input
  placeholder="Search contacts, mines, or groups..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="pl-10 text-base"
  data-testid="sh-contact-search"
/>

// Add search result count
{Object.keys(filteredContactsData).length > 0 && debouncedSearchTerm && (
  <div className="mb-4">
    <p className="text-sm text-gray-600">
      Found {Object.values(filteredContactsData).reduce((total, mines) => 
        total + Object.values(mines).reduce((sum, contacts) => sum + contacts.length, 0), 0
      )} contacts matching "{debouncedSearchTerm}"
    </p>
  </div>
)}

Add virtual scrolling for large lists (optional optimization):

// Add to ContactAccordion.tsx for large contact lists
const MAX_VISIBLE_CONTACTS = 50;

// Limit visible contacts for performance
const limitedContactsData = useMemo(() => {
  const result: ContactsHierarchy = {};
  let totalContacts = 0;

  for (const [group, mines] of Object.entries(filteredContactsData)) {
    if (totalContacts >= MAX_VISIBLE_CONTACTS) break;
    
    result[group] = {};
    for (const [mine, contacts] of Object.entries(mines)) {
      if (totalContacts >= MAX_VISIBLE_CONTACTS) break;
      
      const remainingSlots = MAX_VISIBLE_CONTACTS - totalContacts;
      result[group][mine] = contacts.slice(0, remainingSlots);
      totalContacts += result[group][mine].length;
    }
  }

  return result;
}, [filteredContactsData]);
Manual Validation:

 Search is debounced to prevent excessive API calls
 Search results update smoothly without lag
 Search result count displays accurately
 Large contact lists perform well (test with 500+ contacts)
 Memory usage remains stable during filtering
 Search clears properly when input is emptied


RetryJContinueEdit7. Error Handling and Offline Support
Cursor Prompt:
Add comprehensive error handling and offline support for the Add Contact functionality.

Create `/app/components/OfflineBanner.tsx`:

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  isStale?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  isOnline, 
  isStale = false 
}) => {
  if (isOnline && !isStale) return null;

  return (
    <Alert className={`mb-4 ${isStale ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-yellow-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={isStale ? 'text-yellow-800' : 'text-red-800'}>
          {isOnline 
            ? 'Using cached data. Some contacts may be outdated.'
            : 'You\'re offline. Showing previously downloaded contacts.'
          }
        </AlertDescription>
      </div>
    </Alert>
  );
};

Create `/app/hooks/useNetworkStatus.ts`:

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Initial check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return isOnline;
}

Update ContactAccordion with offline support:

// Add to ContactAccordion.tsx imports
import { OfflineBanner } from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Add to ContactAccordion component
const isOnline = useNetworkStatus();
const [retryCount, setRetryCount] = useState(0);
const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);

// Enhanced fetch with retry logic
const fetchContacts = async (isRetry = false) => {
  try {
    setLoading(true);
    if (!isRetry) {
      setError(null);
    }
    
    const response = await fetch('/api/contacts', {
      // Add cache control for offline support
      headers: {
        'Cache-Control': 'max-age=3600, stale-while-revalidate=86400'
      }
    });
    const data = await response.json();
    
    if (data.ok) {
      setContactsData(data.data);
      setStale(data.stale || false);
      setLastSuccessfulFetch(new Date());
      setRetryCount(0);
    } else {
      throw new Error(data.message || 'Failed to load contacts');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unable to load contacts';
    
    if (retryCount < 3 && isOnline) {
      // Auto-retry for network errors
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchContacts(true);
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff
    } else {
      setError(errorMessage);
    }
  } finally {
    setLoading(false);
  }
};

// Add offline banner to render
return (
  <div className={className} data-testid="sh-contact-accordion">
    <OfflineBanner isOnline={isOnline} isStale={stale} />
    
    {/* Connection status for debugging */}
    {process.env.NODE_ENV === 'development' && (
      <div className="mb-2 text-xs text-gray-500">
        Status: {isOnline ? 'Online' : 'Offline'} | 
        Last fetch: {lastSuccessfulFetch?.toLocaleTimeString() || 'Never'} |
        Retry: {retryCount}/3
      </div>
    )}
    
    {/* Rest of component... */}
  </div>
);

Update Add Contact page with offline handling:

// Add to AddContactPage.tsx
const isOnline = useNetworkStatus();
const [saveAttempted, setSaveAttempted] = useState(false);

const handleSaveContact = async () => {
  if (!selectedContact || !editingRequestId) return;

  // Check online status before attempting save
  if (!isOnline) {
    setError('Cannot save contact while offline. Please check your connection.');
    return;
  }

  setSaving(true);
  setSaveAttempted(true);
  setError(null);

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingRequestId,
        contact: selectedContact
      }),
      // Add timeout for mobile networks
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();

    if (data.ok) {
      // Mark for refresh on main page
      sessionStorage.setItem('shouldRefreshRequests', 'true');
      sessionStorage.removeItem('editingRequestId');
      router.push('/');
    } else {
      setError(data.message || 'Failed to save contact');
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      setError('Save timed out. Please check your connection and try again.');
    } else {
      setError('Unable to save contact. Please try again.');
    }
    console.error('Error saving contact:', err);
  } finally {
    setSaving(false);
  }
};

// Add connection status to UI
{saveAttempted && !isOnline && (
  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
    <p className="text-orange-800 text-sm">
      ⚠️ Connection lost. Please reconnect to save your selection.
    </p>
  </div>
)}
Manual Validation:

 Offline banner appears when connection lost
 Stale data warning shows for cached content
 Auto-retry logic works with exponential backoff
 Save prevents when offline with clear messaging
 Timeout handling works for slow connections
 Network status detection accurate across browsers
 Error messages are user-friendly and actionable


8. Accessibility and Keyboard Navigation
Cursor Prompt:
Add comprehensive accessibility features and keyboard navigation support.

Update ContactAccordion with accessibility improvements:

// Add keyboard event handlers to ContactAccordion.tsx
const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  action: () => void,
  type: 'group' | 'mine' | 'contact'
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
  
  // Arrow key navigation for contacts
  if (type === 'contact' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    const contactElements = document.querySelectorAll('[data-testid^="sh-contact-person-"]');
    const currentIndex = Array.from(contactElements).findIndex(el => el === event.target);
    
    if (currentIndex !== -1) {
      const nextIndex = event.key === 'ArrowDown' 
        ? Math.min(currentIndex + 1, contactElements.length - 1)
        : Math.max(currentIndex - 1, 0);
      
      (contactElements[nextIndex] as HTMLElement)?.focus();
    }
  }
};

// Update Mine Group headers with accessibility
<div
  className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
  onClick={() => toggleGroup(group)}
  onKeyDown={(e) => handleKeyboardNavigation(e, () => toggleGroup(group), 'group')}
  tabIndex={0}
  role="button"
  aria-expanded={isGroupExpanded}
  aria-controls={`group-${group.replace(/\s+/g, '-')}`}
  aria-label={`${isGroupExpanded ? 'Collapse' : 'Expand'} ${group} mine group with ${totalContacts} contacts`}
  data-testid={`sh-contact-group-${group.replace(/\s+/g, '-').toLowerCase()}`}
>

// Update Mine Name headers with accessibility
<div
  className="p-4 pl-8 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
  onClick={() => toggleMine(group, mine)}
  onKeyDown={(e) => handleKeyboardNavigation(e, () => toggleMine(group, mine), 'mine')}
  tabIndex={0}
  role="button"
  aria-expanded={isMineExpanded}
  aria-controls={`mine-${mineKey.replace(/\s+/g, '-')}`}
  aria-label={`${isMineExpanded ? 'Collapse' : 'Expand'} ${mine} with ${contacts.length} contacts`}
  data-testid={`sh-contact-mine-${mineKey.replace(/\s+/g, '-').toLowerCase()}`}
>

// Update Contact items with accessibility
<div
  className={`p-4 pl-12 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${
    selectedContact?.personId === contact.personId
      ? 'bg-blue-50 border-blue-100'
      : 'hover:bg-gray-25 active:bg-gray-50'
  }`}
  onClick={() => handleContactSelect(contact)}
  onKeyDown={(e) => handleKeyboardNavigation(e, () => handleContactSelect(contact), 'contact')}
  tabIndex={0}
  role="button"
  aria-pressed={selectedContact?.personId === contact.personId}
  aria-label={`Select ${contact.name} from ${contact.mineName}, ${contact.mineGroup}. ${contact.email ? `Email: ${contact.email}. ` : ''}${contact.phone ? `Phone: ${contact.phone}` : ''}`}
  data-testid={`sh-contact-person-${contact.personId}`}
>

// Add screen reader announcements
const [announcement, setAnnouncement] = useState('');

const announceToScreenReader = (message: string) => {
  setAnnouncement(message);
  setTimeout(() => setAnnouncement(''), 1000);
};

// Update contact selection to announce
const handleContactSelect = (contact: Contact) => {
  setState(prev => ({ ...prev, selectedContact: contact }));
  onSelectContact(contact);
  announceToScreenReader(`Selected ${contact.name} from ${contact.mineName}`);
};

// Add live region for announcements
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
  data-testid="sh-screen-reader-announcements"
>
  {announcement}
</div>

Create `/app/components/SkipLink.tsx`:

import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      data-testid="sh-skip-link"
    >
      Skip to main content
    </a>
  );
};

Update Add Contact page with accessibility:

// Add to AddContactPage.tsx imports
import { SkipLink } from '@/components/SkipLink';

// Add skip link and proper headings
return (
  <div className="min-h-screen bg-gray-50" data-testid="sh-add-contact-page">
    <SkipLink />
    
    {/* Header with proper heading hierarchy */}
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="p-2"
            aria-label="Go back to requests"
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
          <p className="text-sm text-gray-600 ml-11" id="page-description">
            Select a contact for your request
          </p>
        )}
      </div>
    </div>

    <main id="main-content" aria-describedby="page-description">
      {/* Rest of content... */}
    </main>

    {/* Enhanced bottom actions with ARIA */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4" role="toolbar" aria-label="Contact selection actions">
      <div className="container mx-auto max-w-2xl flex gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
          disabled={saving}
          aria-label="Cancel contact selection and return to requests"
          data-testid="sh-add-contact-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveContact}
          disabled={!selectedContact || saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          aria-label={selectedContact ? `Save ${selectedContact.name} as contact` : 'Save contact (no contact selected)'}
          aria-describedby={selectedContact ? 'selected-contact-info' : undefined}
          data-testid="sh-add-contact-save"
        >
          {saving ? 'Saving...' : 'Save Contact'}
        </Button>
      </div>
    </div>
  </div>
);

Add focus management:

// Add focus management to ContactAccordion
const searchInputRef = useRef<HTMLInputElement>(null);
const lastFocusedElementRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  // Focus search input when component mounts
  if (searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, []);

// Update search input with ref
<Input
  ref={searchInputRef}
  placeholder="Search contacts, mines, or groups..."
  value={state.searchTerm}
  onChange={(e) => updateSearchTerm(e.target.value)}
  className="pl-10 text-base"
  aria-label="Search contacts by name, mine, or group"
  data-testid="sh-contact-search"
/>
Manual Validation:

 Skip link appears on focus and works correctly
 All interactive elements are keyboard accessible
 Tab order follows logical flow through the page
 Arrow keys navigate between contacts in same mine
 Screen reader announces contact selections
 ARIA labels provide context for all elements
 Focus management works when returning from other pages
 High contrast mode maintains visibility
 Screen reader reads content in logical order


9. Testing and Validation
Cursor Prompt:
Create comprehensive tests for the Add Contact functionality.

Create `/app/__tests__/add-contact.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AddContactPage from '@/app/add-contact/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockContactsData = {
  'Anglo American': {
    'Kopanang Mine': [
      {
        personId: 1,
        name: 'John Smith',
        email: 'john.smith@kopanang.co.za',
        phone: '+27123456789',
        mineGroup: 'Anglo American',
        mineName: 'Kopanang Mine'
      }
    ]
  }
};

describe('AddContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Mock successful contacts API
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockContactsData,
        stale: false,
        source: 'cache'
      })
    });

    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn((key) => 
      key === 'editingRequestId' ? 'test-request-id' : null
    );
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  it('renders page with correct header and navigation', async () => {
    render(<AddContactPage />);

    expect(screen.getByText('Add Contact')).toBeInTheDocument();
    expect(screen.getByTestId('sh-add-contact-back')).toBeInTheDocument();
    expect(screen.getByText('RTSE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('sh-contact-accordion')).toBeInTheDocument();
    });
  });

  it('loads and displays contacts in hierarchy', async () => {
    render(<AddContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Anglo American')).toBeInTheDocument();
    });

    // Expand mine group
    fireEvent.click(screen.getByTestId('sh-contact-group-anglo-american'));

    await waitFor(() => {
      expect(screen.getByText('Kopanang Mine')).toBeInTheDocument();
    });

    // Expand mine
    fireEvent.click(screen.getByTestId('sh-contact-mine-anglo-american-kopanang-mine'));

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('john.smith@kopanang.co.za')).toBeInTheDocument();
    });
  });

  it('handles contact selection and save', async () => {
    render(<AddContactPage />);

    // Wait for contacts to load and expand hierarchy
    await waitFor(() => {
      expect(screen.getByText('Anglo American')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-contact-group-anglo-american'));
    fireEvent.click(screen.getByTestId('sh-contact-mine-anglo-american-kopanang-mine'));

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    // Select contact
    fireEvent.click(screen.getByTestId('sh-contact-person-1'));

    // Verify contact is selected and preview appears
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    
    // Save button should be enabled
    const saveButton = screen.getByTestId('sh-add-contact-save');
    expect(saveButton).not.toBeDisabled();

    // Mock successful save
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: {} })
    });

    // Click save
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-request-id',
          contact: expect.objectContaining({
            personId: 1,
            name: 'John Smith'
          })
        })
      });
    });

    // Should navigate back to main page
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles search functionality', async () => {
    render(<AddContactPage />);

    await waitFor(() => {
      expect(screen.getByTestId('sh-contact-search')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('sh-contact-search');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(searchInput).toHaveValue('John');
  });

  it('handles cancel navigation', async () => {
    render(<AddContactPage />);

    const cancelButton = screen.getByTestId('sh-add-contact-cancel');
    fireEvent.click(cancelButton);

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('editingRequestId');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles error states', async () => {
    // Mock API error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AddContactPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load contacts. Please check your connection.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('handles save errors', async () => {
    render(<AddContactPage />);

    // Select a contact first
    await waitFor(() => {
      expect(screen.getByText('Anglo American')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-contact-group-anglo-american'));
    fireEvent.click(screen.getByTestId('sh-contact-mine-anglo-american-kopanang-mine'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-person-1'));
    });

    // Mock save error
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: false, message: 'Save failed' })
    });

    fireEvent.click(screen.getByTestId('sh-add-contact-save'));

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('redirects when no editingRequestId in session', () => {
    Storage.prototype.getItem = jest.fn(() => null);

    render(<AddContactPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

Create `/app/__tests__/contact-accordion.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactAccordion } from '@/components/ContactAccordion';

const mockContactsData = {
  'Mining Group A': {
    'Mine 1': [
      {
        personId: 1,
        name: 'Alice Johnson',
        email: 'alice@mine1.com',
        phone: '+27111111111',
        mineGroup: 'Mining Group A',
        mineName: 'Mine 1'
      }
    ],
    'Mine 2': [
      {
        personId: 2,
        name: 'Bob Wilson',
        email: 'bob@mine2.com',
        mineGroup: 'Mining Group A', 
        mineName: 'Mine 2'
      }
    ]
  }
};

global.fetch = jest.fn();

describe('ContactAccordion', () => {
  const mockOnSelectContact = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockContactsData,
        stale: false
      })
    });
  });

  it('renders loading state initially', () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);
    
    expect(screen.getByTestId('sh-contacts-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
  });

  it('displays contacts hierarchy after loading', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
      expect(screen.getByText('2 contacts')).toBeInTheDocument();
    });
  });

  it('expands and collapses mine groups', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    // Initially mines should not be visible
    expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();

    // Expand group
    fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));

    await waitFor(() => {
      expect(screen.getByText('Mine 1')).toBeInTheDocument();
      expect(screen.getByText('Mine 2')).toBeInTheDocument();
    });

    // Collapse group
    fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));

    await waitFor(() => {
      expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();
    });
  });

  it('handles contact selection', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    // Navigate to contact
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sh-contact-person-1'));

    expect(mockOnSelectContact).toHaveBeenCalledWith({
      personId: 1,
      name: 'Alice Johnson',
      email: 'alice@mine1.com',
      phone: '+27111111111',
      mineGroup: 'Mining Group A',
      mineName: 'Mine 1'
    });
  });

  it('filters contacts based on search', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByTestId('sh-contact-search')).toBeInTheDocument();
    });

    // Search for specific contact
    const searchInput = screen.getByTestId('sh-contact-search');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Should still show the group but filtered
    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });
  });

  it('displays stale data warning', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        data: mockContactsData,
        stale: true
      })
    });

    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText(/Using offline data/)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<ContactAccordion onSelectContact={mockOnSelectContact} selectedContact={null} />);

    await waitFor(() => {
      expect(screen.getByText('Mining Group A')).toBeInTheDocument();
    });

    const groupButton = screen.getByTestId('sh-contact-group-mining-group-a');
    
    // Test Enter key
    fireEvent.keyDown(groupButton, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Mine 1')).toBeInTheDocument();
    });

    // Test Space key
    fireEvent.keyDown(groupButton, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.queryByText('Mine 1')).not.toBeInTheDocument();
    });
  });
});
Manual Validation:

 All tests pass with npm test
 Integration tests cover complete user workflows
 Error scenarios are properly tested
 Keyboard navigation tests verify accessibility
 Mock data matches real API response structure
 Edge cases (empty results, network errors) are covered
 Performance tests validate large contact lists
 Accessibility tests verify screen reader compatibility


Summary
This comprehensive Add Contact implementation provides:

Mobile-first full-page modal design optimized for touch interaction
Three-tier hierarchical accordion (Mine Group → Mine Name → Contact)
Robust search functionality with debounced input and result filtering
Comprehensive error handling and offline support with retry logic
Full accessibility support including keyboard navigation and screen reader compatibility
Seamless navigation integration with sessionStorage state management
Performance optimizations for large contact lists
Comprehensive testing covering unit, integration, and accessibility scenarios

The implementation follows the established patterns from Sections 1-4 and integrates seamlessly with the main page RequestCard component to provide a complete contact selection workflow.