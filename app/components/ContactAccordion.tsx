'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Search, Mail, Phone, AlertCircle } from 'lucide-react';
import { Contact, ContactsHierarchy, ContactSelectionState } from '../types/contact';
import { useDebounce } from '../hooks/useDebounce';

interface ContactAccordionProps {
  onSelectContact: (contact: Contact) => void;
  className?: string;
  viewOnly?: boolean;
}

export const ContactAccordion: React.FC<ContactAccordionProps> = ({
  onSelectContact,
  className = '',
  viewOnly = false
}) => {
  const [contactsData, setContactsData] = useState<ContactsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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
    if (!debouncedSearchTerm) return contactsData;

    const searchLower = debouncedSearchTerm.toLowerCase();
    
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
  }, [contactsData, debouncedSearchTerm]);

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
    onSelectContact(contact);
  };

  const updateSearchTerm = (term: string) => {
    setSearchTerm(term);
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
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
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
            value={searchTerm}
            onChange={(e) => updateSearchTerm(e.target.value)}
            className="pl-10 text-base"
            data-testid="sh-contact-search"
          />
        </div>
        
        {/* Search Results Count */}
        {Object.keys(filteredContactsData).length > 0 && debouncedSearchTerm && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Found {Object.values(filteredContactsData).reduce((total, mines) => 
                total + Object.values(mines).reduce((sum, contacts) => sum + contacts.length, 0), 0
              )} contacts matching &quot;{debouncedSearchTerm}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Contacts Hierarchy */}
      <div className="space-y-3" data-testid="sh-contacts-hierarchy">
        {Object.entries(filteredContactsData).sort(([a], [b]) => a.localeCompare(b)).map(([group, mines]) => {
          const isGroupExpanded = state.expandedGroups.has(group);
          const totalContacts = Object.values(mines).reduce((sum, contacts) => sum + contacts.length, 0);
          

          
          return (
            <Card key={group} className="overflow-hidden shadow-sm">
              {/* Mine Group Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100 min-h-[44px] flex items-center"
                onClick={() => toggleGroup(group)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleGroup(group);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isGroupExpanded}
                aria-label={`${isGroupExpanded ? 'Collapse' : 'Expand'} ${group} mine group with ${totalContacts} contacts`}
                data-testid={`sh-contact-group-${group.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {isGroupExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <h3 className="font-semibold text-lg text-gray-900">{group}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {totalContacts} contacts
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Mine Names */}
              {isGroupExpanded && (
                <div className="bg-gray-25">
                  {Object.entries(mines).sort(([a], [b]) => a.localeCompare(b)).map(([mine, contacts]) => {
                    const mineKey = `${group}-${mine}`;
                    const isMineExpanded = state.expandedMines.has(mineKey);
                    

                    
                    return (
                      <div key={mine} className="border-b border-gray-100 last:border-b-0">
                        {/* Mine Name Header */}
                        <div
                          className="p-4 pl-8 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100 min-h-[44px] flex items-center"
                          onClick={() => toggleMine(group, mine)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleMine(group, mine);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isMineExpanded}
                          aria-label={`${isMineExpanded ? 'Collapse' : 'Expand'} ${mine} with ${contacts.length} contacts`}
                          data-testid={`sh-contact-mine-${mineKey.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {isMineExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-800">{mine}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {contacts.length}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contacts List */}
                        {isMineExpanded && (
                          <div className="bg-white">
                            {contacts.sort((a, b) => a.name.localeCompare(b.name)).map((contact) => {
                              return (
                                <div
                                  key={contact.personId}
                                  className={`p-4 pl-12 border-b border-gray-50 last:border-b-0 transition-colors min-h-[44px] flex items-center ${
                                    viewOnly 
                                      ? 'cursor-default hover:bg-gray-25' 
                                      : 'cursor-pointer hover:bg-gray-25 active:bg-gray-50'
                                  }`}
                                  onClick={() => !viewOnly && handleContactSelect(contact)}
                                  onKeyDown={(e) => {
                                    if (!viewOnly && (e.key === 'Enter' || e.key === ' ')) {
                                      e.preventDefault();
                                      handleContactSelect(contact);
                                    }
                                  }}
                                  tabIndex={viewOnly ? -1 : 0}
                                  role={viewOnly ? undefined : "button"}
                                  aria-label={
                                    viewOnly 
                                      ? `View ${contact.name} from ${contact.mineName}, ${contact.mineGroup}. ${contact.email ? `Email: ${contact.email}. ` : ''}${contact.phone ? `Phone: ${contact.phone}` : ''}` 
                                      : `Select ${contact.name} from ${contact.mineName}, ${contact.mineGroup}. ${contact.email ? `Email: ${contact.email}. ` : ''}${contact.phone ? `Phone: ${contact.phone}` : ''}`
                                  }
                                  data-testid={`sh-contact-person-${contact.personId}`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex-1">
                                      {/* Row 1: Name only */}
                                      <div className="mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {contact.name}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Row 2: Email and Phone on same row */}
                                      <div className="flex items-center gap-4">
                                        {contact.email && (
                                          <a 
                                            href={`mailto:${contact.email}`}
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Mail className="h-3 w-3" />
                                            <span>{contact.email}</span>
                                          </a>
                                        )}
                                        {contact.phone && (
                                          <a 
                                            href={`tel:${contact.phone}`}
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Phone className="h-3 w-3" />
                                            <span>{contact.phone}</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
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
            {debouncedSearchTerm ? 'No contacts found matching your search.' : 'No contacts available.'}
          </p>
          {debouncedSearchTerm && (
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
