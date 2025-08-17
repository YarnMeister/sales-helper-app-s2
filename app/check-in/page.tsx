'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useRouter } from 'next/navigation';
import { Contact, ContactsHierarchy } from '../types/contact';

export default function CheckInPage() {
  const router = useRouter();
  const [contactsData, setContactsData] = useState<ContactsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/contacts');
      const data = await response.json();
      
      if (data.ok) {
        setContactsData(data.data);
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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(group)) {
        newExpanded.delete(group);
      } else {
        newExpanded.add(group);
      }
      return newExpanded;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading mine groups...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchContacts} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          {Object.entries(contactsData).map(([group, mines]) => {
            const isGroupExpanded = expandedGroups.has(group);
            const totalMines = Object.keys(mines).length;
            
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
                  aria-label={`${isGroupExpanded ? 'Collapse' : 'Expand'} ${group} mine group with ${totalMines} mines`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {isGroupExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <h3 className="font-medium text-gray-800">{group}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {totalMines} mines
                    </Badge>
                  </div>
                </div>
                
                {/* Mines List */}
                {isGroupExpanded && (
                  <div className="bg-white">
                    {Object.entries(mines).map(([mine, contacts]) => (
                      <div
                        key={`${group}-${mine}`}
                        className="p-4 pl-12 border-b border-gray-50 last:border-b-0 transition-colors min-h-[44px] flex items-center hover:bg-gray-25"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {mine}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {contacts.length} contacts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {Object.keys(contactsData).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No mine groups available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
