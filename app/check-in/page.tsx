'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Contact, ContactsHierarchy } from '../types/contact';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';
import { SalespersonModal } from '../components/SalespersonModal';

export default function CheckInPage() {
  const router = useRouter();
  const [contactsData, setContactsData] = useState<ContactsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // New state for check-in form
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [selectedMine, setSelectedMine] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [backInOffice, setBackInOffice] = useState('');
  const [comments, setComments] = useState('');
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);

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

  const handleMineSelect = (mineName: string) => {
    setSelectedMine(mineName);
    // Collapse all accordion groups after selection
    setExpandedGroups(new Set());
  };

  const handleSalespersonSelect = (salesperson: string) => {
    setSelectedSalesperson(salesperson);
    setShowSalespersonModal(false);
  };

  const handleCheckIn = async () => {
    try {
      // Validate required fields
      if (!selectedSalesperson || !selectedMine || !selectedPurpose || !backInOffice) {
        console.error('Missing required fields');
        return;
      }

      const checkInData = {
        salesperson: selectedSalesperson,
        planned_mines: [selectedMine], // Convert single mine to array
        main_purpose: selectedPurpose,
        availability: backInOffice,
        comments: comments.trim() || undefined
      };

      console.log('Submitting check-in data:', checkInData);

      // First, save to database
      const siteVisitResponse = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      });

      if (!siteVisitResponse.ok) {
        const errorData = await siteVisitResponse.json();
        throw new Error(`Failed to save site visit: ${errorData.error || 'Unknown error'}`);
      }

      const siteVisitResult = await siteVisitResponse.json();
      console.log('Site visit saved:', siteVisitResult);

      // Then, send Slack notification (non-blocking)
      try {
        const slackResponse = await fetch('/api/slack/notify-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkInData)
        });

        if (slackResponse.ok) {
          const slackResult = await slackResponse.json();
          console.log('Slack notification sent:', slackResult);
        } else {
          const slackError = await slackResponse.json();
          console.warn('Slack notification failed:', slackError);
          // Don't fail the check-in if Slack fails
        }
      } catch (slackError) {
        console.warn('Slack notification error:', slackError);
        // Don't fail the check-in if Slack fails
      }

      // Navigate back to main page (Deals)
      router.push('/');
      
      // Reset form (this will happen when component unmounts)
      setSelectedSalesperson('James');
      setSelectedMine('');
      setSelectedPurpose('');
      setBackInOffice('');
      setComments('');

    } catch (error) {
      console.error('Check-in failed:', error);
      alert(`Check-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Check-in" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading mine groups...</p>
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Check-in" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchContacts} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Check-in" />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* Salesperson Selection */}
        <div className="mb-3">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Select name</h2>
          <div className="flex gap-2">
            {['James', 'Luyanda', 'Stefan'].map((name) => (
              <Button
                key={name}
                variant={selectedSalesperson === name ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 ${selectedSalesperson === name ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                onClick={() => setSelectedSalesperson(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          {!selectedSalesperson && (
            <p className="text-sm text-gray-500 mt-2">Please select a salesperson to continue</p>
          )}
        </div>

        {/* Mine Selection */}
        <div className="mb-3">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Select visiting mine</h2>
          <div className="space-y-3">
            {/* All Mines Top Level */}
            <Card className="overflow-hidden shadow-sm">
              {/* All Mines Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100 min-h-[44px] flex items-center"
                onClick={() => toggleGroup('all-mines')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleGroup('all-mines');
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={expandedGroups.has('all-mines')}
                aria-label={`${expandedGroups.has('all-mines') ? 'Collapse' : 'Expand'} all mine groups`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has('all-mines') ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <h3 className="font-medium text-gray-800">
                      {selectedMine ? selectedMine : 'All mines'}
                    </h3>
                  </div>
                  {selectedMine ? (
                    <Badge className="bg-red-600 text-white border-0 text-xs">
                      Selected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {Object.values(contactsData).reduce((total, mines) => total + Object.keys(mines).length, 0)} mines
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* All Mine Groups */}
              {expandedGroups.has('all-mines') && (
                <div className="bg-white">
                  {Object.entries(contactsData).sort(([a], [b]) => a.localeCompare(b)).map(([group, mines]) => {
                    const isGroupExpanded = expandedGroups.has(group);
                    const totalMines = Object.keys(mines).length;
                    
                    return (
                      <div key={group} className="border-b border-gray-200 last:border-b-0">
                        {/* Mine Group Header */}
                        <div
                          className="p-4 pl-8 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors active:bg-gray-200 min-h-[44px] flex items-center"
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
                              <h4 className="font-medium text-gray-800">{group}</h4>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {totalMines} mines
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Mines List */}
                        {isGroupExpanded && (
                          <div className="bg-gray-25">
                            {Object.entries(mines).sort(([a], [b]) => a.localeCompare(b)).map(([mine, contacts]) => (
                              <div
                                key={`${group}-${mine}`}
                                className={`p-3 pl-16 border-b border-gray-100 last:border-b-0 transition-colors min-h-[36px] flex items-center hover:bg-gray-50 cursor-pointer ${
                                  selectedMine === mine ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                                }`}
                                onClick={() => handleMineSelect(mine)}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {mine}
                                    </span>
                                    {selectedMine === mine && (
                                      <Badge className="bg-red-600 text-white border-0 text-xs">
                                        Selected
                                      </Badge>
                                    )}
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
          </div>
        </div>

        {/* Purpose Selection */}
        <Card className="p-4 mb-3">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Purpose</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Quote follow-up',
              'Delivery',
              'Site check',
              'Installation support',
              'General sales visit'
            ].map((purpose) => (
              <Button
                key={purpose}
                variant={selectedPurpose === purpose ? 'default' : 'outline'}
                size="sm"
                className={selectedPurpose === purpose ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                onClick={() => setSelectedPurpose(purpose)}
              >
                {purpose}
              </Button>
            ))}
          </div>
        </Card>

        {/* Back in Office Selection */}
        <Card className="p-4 mb-3">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Back in office</h3>
          <div className="flex gap-2">
            {[
              'Later this morning',
              'In the afternoon',
              'Tomorrow'
            ].map((time) => (
              <Button
                key={time}
                variant={backInOffice === time ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 ${backInOffice === time ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                onClick={() => setBackInOffice(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </Card>

        {/* Comments */}
        <Card className="p-4 mb-3">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Comments</h3>
          <Textarea
            placeholder="Enter any additional comments..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px]"
          />
        </Card>

        {/* Check-in Button */}
        <div className="pt-4 pb-20">
          <Button
            onClick={() => {
              if (!selectedSalesperson) {
                setShowSalespersonModal(true);
                return;
              }
              handleCheckIn();
            }}
            variant={selectedSalesperson && selectedMine && selectedPurpose && backInOffice ? "active" : "disabled"}
            className="w-full h-12 text-lg font-medium bg-green-700 hover:bg-green-800 text-white border-green-700"
            disabled={!selectedMine || !selectedPurpose || !backInOffice}
          >
            {selectedSalesperson ? 'Check-in Now' : 'Select Salesperson to Check-in'}
          </Button>
        </div>

        {/* Salesperson Modal */}
        <SalespersonModal
          isOpen={showSalespersonModal}
          onClose={() => setShowSalespersonModal(false)}
          onSelect={handleSalespersonSelect}
          title="Who is checking in?"
        />

        {/* No Results */}
        {Object.keys(contactsData).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No mine groups available.</p>
          </div>
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
