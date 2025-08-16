'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RequestCard } from './components/RequestCard';
import { useRouter } from 'next/navigation';

interface Contact {
  personId: number;
  name: string;
  email?: string;
  mineGroup?: string;
  mineName?: string;
}

interface LineItem {
  pipedriveProductId: number;
  name: string;
  quantity: number;
  price?: number;
}

interface Request {
  id: string;
  request_id: string;
  status: 'draft' | 'submitted' | 'failed';
  salesperson_first_name?: string;
  contact?: Contact;
  line_items: LineItem[];
  comment?: string;
  pipedrive_deal_id?: number;
  created_at: string;
  updated_at: string;
}

export default function MainPage() {
  // PRD: Default to specific salesperson, not "all"
  const [selectedSalesperson, setSelectedSalesperson] = useState('James');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Fetch requests based on selected salesperson
  const fetchRequests = async () => {
    console.log('Fetching requests for salesperson:', selectedSalesperson);
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (selectedSalesperson !== 'all') {
        params.append('salesperson', selectedSalesperson);
      } else {
        params.append('showAll', 'true');
      }
      
      const response = await fetch(`/api/requests?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.ok) {
        setRequests(data.data || []);
        console.log('Set requests:', data.data);
      } else {
        throw new Error(data.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedSalesperson]);

  // Handle returning from contact/line items pages
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('shouldRefreshRequests');
    if (shouldRefresh) {
      sessionStorage.removeItem('shouldRefreshRequests');
      fetchRequests();
    }
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Selected salesperson changed to:', selectedSalesperson);
  }, [selectedSalesperson]);

  useEffect(() => {
    console.log('Requests state updated:', requests.length, 'requests');
  }, [requests]);

  const handleSalespersonChange = (salesperson: string) => {
    console.log('Changing salesperson from', selectedSalesperson, 'to', salesperson);
    setSelectedSalesperson(salesperson);
  };

  const handleNewRequest = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salespersonFirstName: selectedSalesperson === 'all' ? 'James' : selectedSalesperson,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      const data = await response.json();
      if (data.ok) {
        setRequests(prev => [data.data, ...prev]);
      } else {
        throw new Error(data.message || 'Failed to create request');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create new request. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddContact = (requestId: string) => {
    sessionStorage.setItem('editingRequestId', requestId);
    router.push('/add-contact');
  };

  const handleAddLineItems = (requestId: string) => {
    sessionStorage.setItem('editingRequestId', requestId);
    router.push('/add-line-items');
  };

  const handleAddComment = (requestId: string) => {
    // TODO: Implement comment modal/page
    console.log('Add comment for request:', requestId);
  };

  const handleSubmitRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Refresh requests to get updated status
        await fetchRequests();
      } else {
        console.error('Failed to submit request:', data.message);
        // Update status to failed
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'failed' } : req
        ));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'failed' } : req
      ));
    }
  };

  const handleViewDeal = (dealId: number) => {
    // TODO: Implement deal viewing functionality
    console.log('Viewing deal:', dealId);
    window.open(`https://yourcompany.pipedrive.com/deal/${dealId}`, '_blank');
  };

  const getPageTitle = () => {
    if (selectedSalesperson === 'all') {
      return 'All Requests';
    }
    return `${selectedSalesperson}'s Requests`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        pageTitle={getPageTitle()}
        selectedSalesperson={selectedSalesperson}
        onSalespersonChange={handleSalespersonChange}
        showNewButton={selectedSalesperson !== 'all'}
        onNewRequest={handleNewRequest}
        isCreating={isCreating}
      />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {selectedSalesperson === 'all' 
                ? 'No requests found' 
                : `No requests found for ${selectedSalesperson}`
              }
            </p>
            {selectedSalesperson !== 'all' && (
              <p className="text-sm text-gray-400">
                Create your first request using the button above
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4" data-testid="sh-requests-list">
            {requests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                onAddContact={handleAddContact}
                onAddLineItems={handleAddLineItems}
                onAddComment={handleAddComment}
                onSubmit={handleSubmitRequest}
                onViewDeal={handleViewDeal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
