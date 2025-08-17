'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RequestCard } from './components/RequestCard';
import { BottomNavigation } from './components/BottomNavigation';
import { useRouter } from 'next/navigation';
import { useToast } from './hooks/use-toast';
import { Search, Filter } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  // Fetch requests based on selected salesperson
  const fetchRequests = useCallback(async () => {
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
        // Sort requests by QR-ID in descending order (newest first)
        const sortedRequests = (data.data || []).sort((a: Request, b: Request) => {
          const aNum = parseInt(a.request_id.replace('QR-', ''));
          const bNum = parseInt(b.request_id.replace('QR-', ''));
          return bNum - aNum; // Descending order (newest first)
        });
        setRequests(sortedRequests);
        console.log('Set requests:', sortedRequests);
      } else {
        throw new Error(data.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSalesperson]);

  useEffect(() => {
    fetchRequests();
  }, [selectedSalesperson, fetchRequests]);

  // Handle returning from contact/line items pages
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('shouldRefreshRequests');
    if (shouldRefresh) {
      sessionStorage.removeItem('shouldRefreshRequests');
      fetchRequests();
    }
  }, [fetchRequests]);

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
        // Add new request at the top of the list
        setRequests(prev => [data.data, ...prev]);
        
        // Scroll to top so user can see the new request
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Show success toast
        toast({
          title: "New Request Created",
          description: `Request ${data.data.request_id} has been created successfully.`,
        });
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

  const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
    try {
      const requestBody = { 
        id: requestId, 
        [field]: value
      };
      
      console.log('🔍 Frontend: Sending update request:', requestBody);
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to update request');
      }

      const result = await response.json();
      
      // Use the complete API response data instead of manual state update
      if (result.ok && result.data) {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? result.data  // ← Use complete API response!
            : req
        ));
        
        // Mark as recently updated
        setRecentlyUpdated(prev => new Set(prev).add(requestId));
        
        // Remove the indicator after 3 seconds
        setTimeout(() => {
          setRecentlyUpdated(prev => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
        }, 3000);
      } else {
        console.error('Failed to update request:', result.message);
        // For comments, we might want to show a more specific error
        if (field === 'comment') {
          throw new Error(result.message || 'Failed to save comment');
        }
      }
    } catch (error) {
      console.error('Error updating request:', error);
      // Re-throw for comment-specific error handling
      if (field === 'comment') {
        throw error;
      }
    }
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
        // Show success toast
        toast({
          title: "Deal Submitted Successfully",
          description: `Deal ${requestId} has been submitted to Pipedrive.`,
        });
        
        // Refresh requests to get updated status
        await fetchRequests();
      } else {
        console.error('Failed to submit request:', data.message);
        
        // Show error toast
        toast({
          title: "Submission Failed",
          description: data.message || "Failed to submit deal to Pipedrive.",
          variant: "destructive",
        });
        
        // Update status to failed
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'failed' } : req
        ));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      
      // Show error toast
      toast({
        title: "Submission Failed",
        description: "Network error occurred while submitting deal.",
        variant: "destructive",
      });
      
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

  // Filter requests based on search and status
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      (request.request_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.contact?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.salesperson_first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getPageTitle = () => {
    if (selectedSalesperson === 'all') {
      return 'All Requests';
    }
    return `${selectedSalesperson}'s Requests`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sales Helper</h1>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deals, contacts, or IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setStatusFilter(statusFilter === 'all' ? 'draft' : 'all')}
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === 'all' ? 'All Status' : 'Draft Only'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleSalespersonChange(selectedSalesperson === 'all' ? 'James' : 'all')}
              >
                {selectedSalesperson === 'all' ? 'All Reps' : selectedSalesperson}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
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
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'No requests match your search criteria'
                : selectedSalesperson === 'all' 
                  ? 'No requests found' 
                  : `No requests found for ${selectedSalesperson}`
              }
            </p>
            {selectedSalesperson !== 'all' && !searchTerm && statusFilter === 'all' && (
              <p className="text-sm text-gray-400">
                Create your first request using the button above
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4" data-testid="sh-requests-list">
            {filteredRequests.map(request => (
              <div key={request.id} className="relative">
                {recentlyUpdated.has(request.id) && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded animate-pulse">
                      Updated
                    </div>
                  </div>
                )}
                <RequestCard
                  request={request}
                  onAddContact={handleAddContact}
                  onAddLineItems={handleAddLineItems}
                  onSubmit={handleSubmitRequest}
                  onUpdateInline={handleInlineUpdate}
                  onViewDeal={handleViewDeal}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation onNewRequest={handleNewRequest} isCreating={isCreating} />
    </div>
  );
}
