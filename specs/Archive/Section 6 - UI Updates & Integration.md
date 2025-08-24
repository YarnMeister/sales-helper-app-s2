Section 6: UI Updates & Integration
6.1 Main Page Redesign with Flat Schema Integration
Goal: Implement streamlined UI that leverages the flat JSONB schema for optimal performance with PRD-compliant inline editing
Cursor Prompt:
Update the main page to work with the new flat JSONB schema and caching system. Create a simplified RequestCard that takes advantage of the embedded contact and line_items data with PRD-compliant inline editing functionality.

Create `/app/components/RequestCard.tsx`:

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, User, Package, MessageSquare, ExternalLink, Edit, X } from 'lucide-react';

interface LineItem {
  pipedriveProductId: number;
  name: string;
  quantity: number;
  price?: number;
  customDescription?: string;
}

interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  mineGroup?: string;
  mineName?: string;
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

interface RequestCardProps {
  request: Request;
  onUpdate: (requestId: string, updates: Partial<Request>) => Promise<void>;
  onDelete: (requestId: string) => Promise<void>;
  onAddContact: (requestId: string) => void;
  onAddLineItems: (requestId: string) => void;
  onSubmit: (requestId: string) => Promise<void>;
  onUpdateInline: (requestId: string, field: string, value: any) => Promise<void>;
  salesperson: string;
  showNewButton: boolean;
}

// PRD-compliant inline contact display component
const ContactDisplay: React.FC<{
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  isSubmitted: boolean;
}> = ({ contact, onEdit, onDelete, isSubmitted }) => (
  <div 
    className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
    data-testid="sh-request-contact-display"
  >
    <User className="h-4 w-4 text-green-600" />
    <div className="flex-1">
      <p className="font-medium">{contact.name}</p>
      {contact.mineGroup && contact.mineName && (
        <p className="text-sm text-gray-600">
          {contact.mineGroup} → {contact.mineName}
        </p>
      )}
      {contact.email && (
        <p className="text-xs text-gray-500">{contact.email}</p>
      )}
    </div>
    {!isSubmitted && (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          data-testid="sh-request-change-contact-button"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          data-testid="sh-request-delete-contact-button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
);

// PRD-compliant line items display with inline deletion
const LineItemsDisplay: React.FC<{
  items: LineItem[];
  onEdit: () => void;
  onDeleteItem: (index: number) => void;
  isSubmitted: boolean;
}> = ({ items, onEdit, onDeleteItem, isSubmitted }) => (
  <div className="space-y-2" data-testid="sh-request-lineitems-display">
    {items.map((item, index) => (
      <div 
        key={`${item.pipedriveProductId}-${index}`}
        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
      >
        <Package className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-600">
            Qty: {item.quantity}
            {item.price && ` • R${item.price.toFixed(2)}`}
          </p>
          {item.customDescription && (
            <p className="text-xs text-gray-500">{item.customDescription}</p>
          )}
        </div>
        {!isSubmitted && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              data-testid="sh-request-edit-lineitems-button"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteItem(index)}
              data-testid={`sh-request-delete-lineitem-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    ))}
    {!isSubmitted && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        data-testid="sh-request-add-more-items-button"
      >
        <Package className="h-4 w-4 mr-2" />
        Add More Items
      </Button>
    )}
  </div>
);

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onUpdate,
  onDelete,
  onAddContact,
  onAddLineItems,
  onSubmit,
  onUpdateInline,
  salesperson,
  showNewButton
}) => {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentValue, setCommentValue] = useState(request.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRD: Auto-save comment on focus loss
  const handleCommentBlur = async () => {
    if (commentValue.trim() !== request.comment) {
      await onUpdateInline(request.id, 'comment', commentValue.trim());
    }
    setIsEditingComment(false);
  };

  const handleCommentCancel = () => {
    setCommentValue(request.comment || '');
    setIsEditingComment(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(request.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PRD: Inline contact deletion
  const handleDeleteContact = async () => {
    await onUpdateInline(request.id, 'contact', null);
  };

  // PRD: Inline line item deletion
  const handleDeleteLineItem = async (index: number) => {
    const newItems = request.line_items.filter((_, i) => i !== index);
    await onUpdateInline(request.id, 'line_items', newItems);
  };

  // PRD: Submit button enabling logic
  const canSubmit = request.contact && request.line_items.length > 0;
  const isSubmitted = request.status === 'submitted';
  const isFailed = request.status === 'failed';

  const getDealUrl = () => {
    if (!request.pipedrive_deal_id) return '#';
    
    const submitMode = process.env.NEXT_PUBLIC_PIPEDRIVE_SUBMIT_MODE || 'real';
    if (submitMode === 'mock') {
      return `#mock-deal-${request.pipedrive_deal_id}`;
    }
    return `https://yourcompany.pipedrive.com/deal/${request.pipedrive_deal_id}`;
  };

  return (
    <Card className="p-4 mb-4" data-testid="sh-request-card" data-status={request.status}>
      {/* Header with QR ID and Status - PRD compliant */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="font-mono text-lg font-semibold"
              data-testid="sh-request-id"
            >
              {request.request_id}
            </span>
            <Badge 
              variant={
                request.status === 'submitted' ? 'default' : 
                request.status === 'failed' ? 'destructive' : 
                'secondary'
              }
              data-testid="sh-request-status-badge"
            >
              {request.status}
            </Badge>
          </div>
          {request.salesperson_first_name && (
            <p className="text-sm text-gray-600">
              by {request.salesperson_first_name}
            </p>
          )}
        </div>
        
        {!isSubmitted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(request.id)}
            data-testid="sh-request-delete-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Contact Section - PRD inline editing */}
      <div className="mb-4">
        {request.contact ? (
          <ContactDisplay
            contact={request.contact}
            onEdit={() => onAddContact(request.id)}
            onDelete={handleDeleteContact}
            isSubmitted={isSubmitted}
          />
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAddContact(request.id)}
            data-testid="sh-request-add-contact-button"
          >
            <User className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        )}
      </div>

      {/* Line Items Section - PRD inline editing */}
      <div className="mb-4">
        {request.line_items.length > 0 ? (
          <LineItemsDisplay
            items={request.line_items}
            onEdit={() => onAddLineItems(request.id)}
            onDeleteItem={handleDeleteLineItem}
            isSubmitted={isSubmitted}
          />
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAddLineItems(request.id)}
            data-testid="sh-request-add-lineitem-button"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Line Items
          </Button>
        )}
      </div>

      {/* Comment Section - PRD inline editing with auto-save */}
      <div className="mb-4">
        {isEditingComment ? (
          <div className="space-y-2">
            <Textarea
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              onBlur={handleCommentBlur}
              placeholder="Add a comment..."
              className="min-h-[80px]"
              data-testid="sh-request-comment-input"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCommentBlur}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCommentCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : request.comment ? (
          <div 
            className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => !isSubmitted && setIsEditingComment(true)}
            data-testid="sh-request-comment-display"
          >
            <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{request.comment}</p>
              {!isSubmitted && (
                <p className="text-xs text-gray-500 mt-1">Click to edit</p>
              )}
            </div>
          </div>
        ) : !isSubmitted && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsEditingComment(true)}
            data-testid="sh-request-add-comment-button"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        )}
      </div>

      {/* Action Buttons - PRD submit button logic */}
      <div className="flex gap-2">
        {isSubmitted ? (
          <Button
            variant="default"
            className="flex-1"
            onClick={() => window.open(getDealUrl(), '_blank')}
            data-testid="sh-request-see-deal-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            See Deal
          </Button>
        ) : isFailed ? (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            data-testid="sh-request-retry-button"
          >
            {isSubmitting ? 'Retrying...' : 'Retry Submission'}
          </Button>
        ) : (
          <Button
            variant="default"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            data-testid="sh-request-submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit to Pipedrive'}
          </Button>
        )}
      </div>

      {/* Validation Messages */}
      {!canSubmit && !isSubmitted && !isFailed && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
          {!request.contact && !request.line_items.length ? 
            'Add contact and line items to submit' :
            !request.contact ? 'Add contact to submit' :
            'Add line items to submit'
          }
        </div>
      )}
    </Card>
  );
};

Update `/app/page.tsx` to use the new flat schema API with PRD-compliant navigation patterns:

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw } from 'lucide-react';
import { RequestCard } from '@/components/RequestCard';
import { useRouter } from 'next/navigation';

interface Request {
  id: string;
  request_id: string;
  status: 'draft' | 'submitted' | 'failed';
  salesperson_first_name?: string;
  contact?: any;
  line_items: any[];
  comment?: string;
  pipedrive_deal_id?: number;
  created_at: string;
  updated_at: string;
}

// PRD-compliant salesperson filter component
const SalespersonFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
}> = ({ value, onChange, options }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-48" data-testid="sh-main-salesperson-filter">
      <SelectValue placeholder="Select salesperson" />
    </SelectTrigger>
    <SelectContent>
      {options.map(person => (
        <SelectItem key={person} value={person}>
          {person === 'all' ? 'All Requests' : person}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function MainPage() {
  // PRD: Default to James, not "all"
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('James');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMineGroup, setSelectedMineGroup] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const salespeople = ['Luyanda', 'James', 'Stefan', 'all'];
  const statuses = ['draft', 'submitted', 'failed'];

  // PRD: Hide New Request when "All Requests" selected
  const showNewButton = selectedSalesperson !== 'all';
  const showAll = selectedSalesperson === 'all';

  // Extract unique mine groups from loaded requests for filtering
  const mineGroups = Array.from(new Set(
    requests
      .map(req => req.contact?.mineGroup)
      .filter(Boolean)
  )).sort();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Build query parameters using the optimized filters
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedMineGroup !== 'all') params.set('mineGroup', selectedMineGroup);
      // PRD: Only filter by salesperson if not showing all
      if (!showAll) params.set('salesperson', selectedSalesperson);
      params.set('limit', '100'); // Reasonable limit for UI
      
      const response = await fetch(`/api/requests?${params.toString()}`);
      const data = await response.json();
      
      if (data.ok) {
        setRequests(data.data);
      } else {
        console.error('Failed to fetch requests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedSalesperson, selectedStatus, selectedMineGroup]); // Re-fetch when filters change

  // PRD: Create inline on main page
  const createNewRequest = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salespersonFirstName: selectedSalesperson,
          line_items: []
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRequests(prev => [data.data, ...prev]);
      } else {
        console.error('Failed to create request:', data.message);
      }
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const updateRequest = async (requestId: string, updates: Partial<Request>) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, ...updates })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, ...data.data } : req
        ));
      } else {
        console.error('Failed to update request:', data.message);
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  // PRD: Inline update handler for specific fields
  const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
    try {
      const updates = { [field]: value };
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, ...updates })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, ...updates } : req
        ));
      } else {
        console.error('Failed to update request:', data.message);
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests?id=${requestId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        console.error('Failed to delete request:', data.message);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const submitRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Refresh the specific request to get updated status
        await fetchRequests();
      } else {
        console.error('Failed to submit request:', data.message);
        // Update status to failed
        await updateRequest(requestId, { status: 'failed' });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      await updateRequest(requestId, { status: 'failed' });
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

  // Apply client-side filters for salesperson (since it's not indexed)
  const filteredRequests = showAll 
    ? requests 
    : requests.filter(req => req.salesperson_first_name === selectedSalesperson);

  return (
    <div className="container mx-auto p-4" data-testid="sh-main-page">
      {/* Header - PRD compliant */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Requests</h1>
        <Button 
          onClick={fetchRequests} 
          variant="ghost" 
          size="sm"
          data-testid="sh-main-refresh-button"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters - PRD navigation patterns */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <SalespersonFilter
          value={selectedSalesperson}
          onChange={setSelectedSalesperson}
          options={salespeople}
        />

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48" data-testid="sh-main-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMineGroup} onValueChange={setSelectedMineGroup}>
          <SelectTrigger className="w-48" data-testid="sh-main-mine-filter">
            <SelectValue placeholder="Filter by mine group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mine Groups</SelectItem>
            {mineGroups.map(group => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showNewButton && (
          <Button 
            onClick={createNewRequest} 
            disabled={isCreating}
            data-testid="sh-main-new-request-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Request'}
          </Button>
        )}
      </div>

      {/* Request Statistics Dashboard */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Total Requests</p>
            <p className="text-2xl font-bold text-blue-900">{filteredRequests.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-600">Submitted</p>
            <p className="text-2xl font-bold text-green-900">
              {filteredRequests.filter(r => r.status === 'submitted').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-600">Draft</p>
            <p className="text-2xl font-bold text-yellow-900">
              {filteredRequests.filter(r => r.status === 'draft').length}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-600">Failed</p>
            <p className="text-2xl font-bold text-red-900">
              {filteredRequests.filter(r => r.status === 'failed').length}
            </p>
          </div>
        </div>
      )}

      {/* Requests List - PRD inline editing */}
      <div className="space-y-4" data-testid="sh-main-requests-list">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showAll 
              ? 'No requests found' 
              : `No requests found for ${selectedSalesperson}`
            }
          </div>
        ) : (
          filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onUpdate={updateRequest}
              onDelete={deleteRequest}
              onAddContact={handleAddContact}
              onAddLineItems={handleAddLineItems}
              onSubmit={submitRequest}
              onUpdateInline={handleInlineUpdate}
              salesperson={selectedSalesperson}
              showNewButton={showNewButton}
            />
          ))
        )}
      </div>
    </div>
  );
}
Manual Validation Steps:

 Test main page loads with optimized database queries
 Verify filtering uses generated columns for performance
 Test PRD-compliant inline editing for contacts and line items
 Verify inline comment editing with auto-save on blur
 Test submission workflow with proper status updates
 Check statistics calculations are accurate
 Test failed status with retry functionality
 Verify New Request button only shows when specific salesperson selected
 Test inline deletion of contacts and line items
 Verify all CRUD operations work with flat schema

Checkbox: - [ ] 6.1 Main Page Redesign with Flat Schema Integration Complete

6.2 Contact and Product Selection with Caching Integration
Goal: Implement efficient UI components that leverage the caching API endpoints with proper error handling
Cursor Prompt:
Create optimized contact and product selection components that work with the caching system established in Section 3. Include proper error handling, offline tolerance, and performance optimizations.

Create `/app/components/ContactSelector.tsx`:

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Check, Phone, Mail, Search, AlertCircle } from 'lucide-react';

interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  mineGroup?: string;
  mineName?: string;
}

interface ContactsData {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

interface ContactSelectorProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: number;
  className?: string;
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  onSelectContact,
  selectedContactId,
  className = ''
}) => {
  const [contactsData, setContactsData] = useState<ContactsData>({});
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedMines, setExpandedMines] = useState<Set<string>>(new Set());

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
      setError('Unable to load contacts. Please try again.');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const toggleGroup = (group: string) => {
    const newRetryJContinueEditExpanded = new Set(expandedGroups);
if (newExpanded.has(group)) {
newExpanded.delete(group);
// Also collapse all mines in this group
const minesToCollapse = Object.keys(contactsData[group] || {}).map(mine => ${group}-${mine});
minesToCollapse.forEach(mine => expandedMines.delete(mine));
setExpandedMines(new Set(expandedMines));
} else {
newExpanded.add(group);
}
setExpandedGroups(newExpanded);
};
const toggleMine = (group: string, mine: string) => {
const mineKey = ${group}-${mine};
const newExpanded = new Set(expandedMines);
if (newExpanded.has(mineKey)) {
newExpanded.delete(mineKey);
} else {
newExpanded.add(mineKey);
}
setExpandedMines(newExpanded);
};
const handleContactSelect = (contact: Contact) => {
onSelectContact(contact);
};
// Filter contacts based on search term
const filteredContactsData = Object.entries(contactsData).reduce((acc, [group, mines]) => {
const filteredMines = Object.entries(mines).reduce((mineAcc, [mine, contacts]) => {
const filteredContacts = contacts.filter(contact =>
contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
group.toLowerCase().includes(searchTerm.toLowerCase()) ||
mine.toLowerCase().includes(searchTerm.toLowerCase())
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
}, {} as ContactsData);
if (loading) {
return (
<div className={text-center py-8 ${className}}>
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
<p className="mt-2 text-gray-600">Loading contacts...</p>
</div>
);
}
if (error) {
return (
<div className={text-center py-8 ${className}}>
<AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
<p className="text-red-600 mb-4">{error}</p>
<Button onClick={fetchContacts} variant="outline">
Try Again
</Button>
</div>
);
}
return (
<div className={className} data-testid="sh-contact-selector">
{stale && (
<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
<p className="text-sm text-yellow-800">
⚠️ Using offline data. Some information may be outdated.
</p>
</div>
)}
  {/* Search */}
  <div className="mb-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search contacts, mines, or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
        data-testid="sh-contact-search"
      />
    </div>
  </div>

  {/* Contacts Tree */}
  <div className="space-y-3" data-testid="sh-contacts-tree">
    {Object.entries(filteredContactsData).map(([group, mines]) => {
      const isGroupExpanded = expandedGroups.has(group);
      const totalContacts = Object.values(mines).reduce((sum, contacts) => sum + contacts.length, 0);
      
      return (
        <Card key={group} className="overflow-hidden">
          <div
            className="p-3 cursor-pointer border-b hover:bg-gray-50 transition-colors"
            onClick={() => toggleGroup(group)}
            data-testid={`sh-contact-group-${group.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isGroupExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <h3 className="font-semibold">{group}</h3>
              </div>
              <Badge variant="secondary">{totalContacts} contacts</Badge>
            </div>
          </div>
          
          {isGroupExpanded && (
            <div className="p-3 space-y-2">
              {Object.entries(mines).map(([mine, contacts]) => {
                const mineKey = `${group}-${mine}`;
                const isMineExpanded = expandedMines.has(mineKey);
                
                return (
                  <Card key={mine} className="border border-gray-200">
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleMine(group, mine)}
                      data-testid={`sh-contact-mine-${mineKey.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isMineExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <h4 className="font-medium">{mine}</h4>
                        </div>
                        <Badge variant="outline">{contacts.length}</Badge>
                      </div>
                    </div>
                    
                    {isMineExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {contacts.map((contact) => (
                          <div
                            key={contact.personId}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedContactId === contact.personId
                                ? 'bg-blue-50 border-blue-200'
                                : 'hover:bg-gray-50 border-gray-200'
                            }`}
                            onClick={() => handleContactSelect(contact)}
                            data-testid={`sh-contact-${contact.personId}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{contact.name}</span>
                                  {selectedContactId === contact.personId && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  {contact.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span>{contact.email}</span>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-1">
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
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      );
    })}
  </div>

  {Object.keys(filteredContactsData).length === 0 && (
    <div className="text-center py-8 text-gray-500">
      {searchTerm ? 'No contacts found matching your search.' : 'No contacts available.'}
    </div>
  )}
</div>
);
};
Create /app/components/ProductSelector.tsx:
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Check, Package, Search, AlertCircle, Plus, Minus } from 'lucide-react';
interface Product {
pipedriveProductId: number;
name: string;
code?: string;
price?: number;
shortDescription?: string;
}
interface ProductWithQuantity extends Product {
quantity: number;
customDescription?: string;
}
interface ProductsData {
[category: string]: Product[];
}
interface ProductSelectorProps {
onSelectProducts: (products: ProductWithQuantity[]) => void;
selectedProducts: ProductWithQuantity[];
className?: string;
multiSelect?: boolean;
}
export const ProductSelector: React.FC<ProductSelectorProps> = ({
onSelectProducts,
selectedProducts,
className = '',
multiSelect = true
}) => {
const [productsData, setProductsData] = useState<ProductsData>({});
const [loading, setLoading] = useState(true);
const [stale, setStale] = useState(false);
const [error, setError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState('');
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
const [quantities, setQuantities] = useState<Record<number, number>>({});
const fetchProducts = async () => {
try {
setLoading(true);
setError(null);
  const response = await fetch('/api/products');
  const data = await response.json();
  
  if (data.ok) {
    setProductsData(data.data);
    setStale(data.stale || false);
  } else {
    setError(data.message || 'Failed to load products');
  }
} catch (err) {
  setError('Unable to load products. Please try again.');
  console.error('Error fetching products:', err);
} finally {
  setLoading(false);
}
};
useEffect(() => {
fetchProducts();
}, []);
// Initialize quantities from selected products
useEffect(() => {
const initialQuantities = selectedProducts.reduce((acc, product) => {
acc[product.pipedriveProductId] = product.quantity;
return acc;
}, {} as Record<number, number>);
setQuantities(initialQuantities);
}, [selectedProducts]);
const toggleCategory = (category: string) => {
const newExpanded = new Set(expandedCategories);
if (newExpanded.has(category)) {
newExpanded.delete(category);
} else {
newExpanded.add(category);
}
setExpandedCategories(newExpanded);
};
const updateQuantity = (productId: number, quantity: number) => {
setQuantities(prev => ({
...prev,
[productId]: Math.max(0, quantity)
}));
};
const handleProductToggle = (product: Product) => {
const currentQuantity = quantities[product.pipedriveProductId] || 0;
const isSelected = selectedProducts.some(p => p.pipedriveProductId === product.pipedriveProductId);
let newProducts: ProductWithQuantity[];

if (isSelected) {
  // Remove product
  newProducts = selectedProducts.filter(p => p.pipedriveProductId !== product.pipedriveProductId);
  setQuantities(prev => {
    const newQuantities = { ...prev };
    delete newQuantities[product.pipedriveProductId];
    return newQuantities;
  });
} else {
  // Add product with quantity 1
  const newProduct: ProductWithQuantity = {
    ...product,
    quantity: 1
  };
  
  if (multiSelect) {
    newProducts = [...selectedProducts, newProduct];
  } else {
    newProducts = [newProduct];
  }
  
  setQuantities(prev => ({
    ...prev,
    [product.pipedriveProductId]: 1
  }));
}

onSelectProducts(newProducts);
};
const handleQuantityChange = (product: Product, newQuantity: number) => {
if (newQuantity <= 0) {
handleProductToggle(product); // Remove if quantity is 0
return;
}
updateQuantity(product.pipedriveProductId, newQuantity);

// Update selected products with new quantity
const updatedProducts = selectedProducts.map(p => 
  p.pipedriveProductId === product.pipedriveProductId 
    ? { ...p, quantity: newQuantity }
    : p
);

onSelectProducts(updatedProducts);
};
// Filter products based on search term
const filteredProductsData = Object.entries(productsData).reduce((acc, [category, products]) => {
const filteredProducts = products.filter(product =>
product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
category.toLowerCase().includes(searchTerm.toLowerCase()) ||
product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
);
if (filteredProducts.length > 0) {
  acc[category] = filteredProducts;
}
return acc;
}, {} as ProductsData);
if (loading) {
return (
<div className={text-center py-8 ${className}}>
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
<p className="mt-2 text-gray-600">Loading products...</p>
</div>
);
}
if (error) {
return (
<div className={text-center py-8 ${className}}>
<AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
<p className="text-red-600 mb-4">{error}</p>
<Button onClick={fetchProducts} variant="outline">
Try Again
</Button>
</div>
);
}
return (
<div className={className} data-testid="sh-product-selector">
{stale && (
<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
<p className="text-sm text-yellow-800">
⚠️ Using offline data. Some information may be outdated.
</p>
</div>
)}
  {/* Search */}
  <div className="mb-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search products, categories, or codes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
        data-testid="sh-product-search"
      />
    </div>
  </div>

  {/* Selected Products Summary */}
  {selectedProducts.length > 0 && (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm font-medium text-blue-900 mb-2">
        Selected Products ({selectedProducts.length})
      </p>
      <div className="space-y-1">
        {selectedProducts.map(product => (
          <div key={product.pipedriveProductId} className="text-sm text-blue-800">
            {product.name} × {product.quantity}
            {product.price && ` (R${(product.price * product.quantity).toFixed(2)})`}
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Products Tree */}
  <div className="space-y-3" data-testid="sh-products-tree">
    {Object.entries(filteredProductsData).map(([category, products]) => {
      const isCategoryExpanded = expandedCategories.has(category);
      
      return (
        <Card key={category} className="overflow-hidden">
          <div
            className="p-3 cursor-pointer border-b hover:bg-gray-50 transition-colors"
            onClick={() => toggleCategory(category)}
            data-testid={`sh-product-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCategoryExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Package className="h-4 w-4" />
                <h3 className="font-semibold">{category}</h3>
              </div>
              <Badge variant="secondary">{products.length} products</Badge>
            </div>
          </div>
          
          {isCategoryExpanded && (
            <div className="p-3 space-y-2">
              {products.map((product) => {
                const isSelected = selectedProducts.some(p => p.pipedriveProductId === product.pipedriveProductId);
                const currentQuantity = quantities[product.pipedriveProductId] || 0;
                
                return (
                  <div
                    key={product.pipedriveProductId}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    data-testid={`sh-product-${product.pipedriveProductId}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{product.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          {product.code && (
                            <Badge variant="outline" className="text-xs">
                              {product.code}
                            </Badge>
                          )}
                        </div>
                        
                        {product.shortDescription && (
                          <p className="text-sm text-gray-600 mb-2">
                            {product.shortDescription}
                          </p>
                        )}
                        
                        {product.price && (
                          <p className="text-sm font-medium text-green-600">
                            R{product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(product, currentQuantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {currentQuantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(product, currentQuantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleProductToggle(product)}
                            data-testid={`sh-add-product-${product.pipedriveProductId}`}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      );
    })}
  </div>

  {Object.keys(filteredProductsData).length === 0 && (
    <div className="text-center py-8 text-gray-500">
      {searchTerm ? 'No products found matching your search.' : 'No products available.'}
    </div>
  )}
</div>
);
};
Update /app/add-contact/page.tsx to use the new ContactSelector:
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ContactSelector } from '@/components/ContactSelector';
import { useRouter } from 'next/navigation';
interface Contact {
personId: number;
name: string;
email?: string;
phone?: string;
orgId?: number;
orgName?: string;
mineGroup?: string;
mineName?: string;
}
export default function AddContactPage() {
const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
const router = useRouter();
useEffect(() => {
const requestId = sessionStorage.getItem('editingRequestId');
if (requestId) {
setEditingRequestId(requestId);
} else {
// No request to edit, redirect back
router.push('/');
}
}, [router]);
const handleContactSelect = (contact: Contact) => {
setSelectedContact(contact);
};
const handleSaveContact = async () => {
if (!selectedContact || !editingRequestId) return;
setSaving(true);
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
    sessionStorage.removeItem('editingRequestId');
    router.push('/');
  } else {
    console.error('Failed to save contact:', data.message);
    // Show error to user
  }
} catch (error) {
  console.error('Error saving contact:', error);
} finally {
  setSaving(false);
}
};
const handleCancel = () => {
sessionStorage.removeItem('editingRequestId');
router.push('/');
};
return (
<div className="container mx-auto p-4 max-w-4xl" data-testid="sh-add-contact-page">
{/* Header */}
<div className="flex items-center gap-4 mb-6">
<Button
       variant="ghost"
       onClick={handleCancel}
       data-testid="sh-add-contact-back-button"
     >
<ArrowLeft className="h-4 w-4 mr-2" />
Back to Requests
</Button>
<div>
<h1 className="text-2xl font-bold">Select Contact</h1>
<p className="text-gray-600">Choose a contact for this request</p>
</div>
</div>
  {/* Contact Selector */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <ContactSelector
        onSelectContact={handleContactSelect}
        selectedContactId={selectedContact?.personId}
      />
    </div>

    {/* Selected Contact Preview */}
    <div className="lg:col-span-1">
      <div className="sticky top-4">
        <h3 className="text-lg font-semibold mb-4">Selected Contact</h3>
        
        {selectedContact ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900">{selectedContact.name}</h4>
            <p className="text-sm text-blue-700 mt-1">
              {selectedContact.mineGroup} → {selectedContact.mineName}
            </p>
            
            {selectedContact.email && (
              <p className="text-sm text-blue-600 mt-2">
                📧 {selectedContact.email}
              </p>
            )}
            
            {selectedContact.phone && (
              <p className="text-sm text-blue-600 mt-1">
                📞 {selectedContact.phone}
              </p>
            )}
            
            <Button
              className="w-full mt-4"
              onClick={handleSaveContact}
              disabled={saving}
              data-testid="sh-save-contact-button"
            >
              {saving ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        ) : (
          <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
            <p>No contact selected</p>
            <p className="text-sm mt-1">Choose a contact from the list to continue</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
);
}
Update /app/add-line-items/page.tsx to use the new ProductSelector:
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProductSelector } from '@/components/ProductSelector';
import { useRouter } from 'next/navigation';
interface LineItem {
pipedriveProductId: number;
name: string;
quantity: number;
price?: number;
customDescription?: string;
}
export default function AddLineItemsPage() {
const [selectedProducts, setSelectedProducts] = useState<LineItem[]>([]);
const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
const router = useRouter();
useEffect(() => {
const requestId = sessionStorage.getItem('editingRequestId');
if (requestId) {
setEditingRequestId(requestId);
// Load existing line items for this request
loadExistingLineItems(requestId);
} else {
router.push('/');
}
}, [router]);
const loadExistingLineItems = async (requestId: string) => {
try {
// We could fetch the specific request to get existing line items
// For now, start with empty selection
} catch (error) {
console.error('Error loading existing line items:', error);
}
};
const handleProductsSelect = (products: LineItem[]) => {
setSelectedProducts(products);
};
const handleSaveLineItems = async () => {
if (!editingRequestId) return;
setSaving(true);
try {
  const response = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: editingRequestId,
      line_items: selectedProducts
    })
  });

  const data = await response.json();

  if (data.ok) {
    sessionStorage.removeItem('editingRequestId');
    router.push('/');
  } else {
    console.error('Failed to save line items:', data.message);
  }
} catch (error) {
  console.error('Error saving line items:', error);
} finally {
  setSaving(false);
}
};
const handleCancel = () => {
sessionStorage.removeItem('editingRequestId');
router.push('/');
};
const totalValue = selectedProducts.reduce((sum, product) => {
return sum + (product.price || 0) * product.quantity;
}, 0);
return (
<div className="container mx-auto p-4 max-w-6xl" data-testid="sh-add-line-items-page">
{/* Header */}
<div className="flex items-center gap-4 mb-6">
<Button
       variant="ghost"
       onClick={handleCancel}
       data-testid="sh-add-line-items-back-button"
     >
<ArrowLeft className="h-4 w-4 mr-2" />
Back to Requests
</Button>
<div>
<h1 className="text-2xl font-bold">Select Products</h1>
<p className="text-gray-600">Add products and quantities to this request</p>
</div>
</div>
  {/* Product Selector */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <ProductSelector
        onSelectProducts={handleProductsSelect}
        selectedProducts={selectedProducts}
        multiSelect={true}
      />
    </div>

    {/* Selection Summary */}
    <div className="lg:col-span-1">
      <div className="sticky top-4">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span>Items:</span>
              <span>{selectedProducts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Quantity:</span>
              <span>{selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}</span>
            </div>
            {totalValue > 0 && (
              <div className="flex justify-between font-medium border-t pt-3">
                <span>Total Value:</span>
                <span>R{totalValue.RetryJContinueEdittoFixed(2)}</span>
</div>
)}
</div>
          <Button
            className="w-full"
            onClick={handleSaveLineItems}
            disabled={selectedProducts.length === 0 || saving}
            data-testid="sh-save-line-items-button"
          >
            {saving ? 'Saving...' : `Save ${selectedProducts.length} Products`}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
);
}

**Manual Validation Steps:**
- [ ] Test contact selector loads hierarchical data from cache API
- [ ] Test product selector loads categorized data from cache API
- [ ] Verify offline mode displays stale data warning properly
- [ ] Test search functionality works across all fields efficiently
- [ ] Test quantity controls work properly for products
- [ ] Verify navigation flow preserves request editing state with sessionStorage
- [ ] Test saving contacts and products updates JSONB fields correctly
- [ ] Check error handling when APIs are unavailable with retry functionality
- [ ] Verify stale data warnings appear when cache is outdated
- [ ] Test loading states and error states work correctly

**Checkbox:** - [ ] 6.2 Contact and Product Selection with Caching Integration Complete

---

## 6.3 Performance Optimization & Testing Integration
**Goal:** Implement performance optimizations and comprehensive testing for the UI layer

**Cursor Prompt:**
Implement performance optimizations for the UI components and create comprehensive tests that integrate with the flat schema.
Create /app/components/RequestCardOptimized.tsx (optimized version):
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, User, Package, MessageSquare, ExternalLink, Edit, X } from 'lucide-react';
// Move interfaces to separate file for reusability
export interface LineItem {
pipedriveProductId: number;
name: string;
quantity: number;
price?: number;
customDescription?: string;
}
export interface Contact {
personId: number;
name: string;
email?: string;
phone?: string;
orgId?: number;
orgName?: string;
mineGroup?: string;
mineName?: string;
}
export interface Request {
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
interface RequestCardOptimizedProps {
request: Request;
onUpdate: (requestId: string, updates: Partial<Request>) => Promise<void>;
onDelete: (requestId: string) => Promise<void>;
onAddContact: (requestId: string) => void;
onAddLineItems: (requestId: string) => void;
onSubmit: (requestId: string) => Promise<void>;
onUpdateInline: (requestId: string, field: string, value: any) => Promise<void>;
salesperson: string;
showNewButton: boolean;
}
// Memoized sub-components for better performance
const ContactDisplay = React.memo<{
contact: Contact;
isSubmitted: boolean;
onAddContact: () => void;
onDeleteContact: () => void;
}>(({ contact, isSubmitted, onAddContact, onDeleteContact }) => (
  <div 
    className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
    data-testid="sh-request-contact-display"
  >
    <User className="h-4 w-4 text-green-600" />
    <div className="flex-1">
      <p className="font-medium">{contact.name}</p>
      {contact.mineGroup && contact.mineName && (
        <p className="text-sm text-gray-600">
          {contact.mineGroup} → {contact.mineName}
        </p>
      )}
      {contact.email && (
        <p className="text-xs text-gray-500">{contact.email}</p>
      )}
    </div>
    {!isSubmitted && (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddContact}
          data-testid="sh-request-change-contact-button"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteContact}
          data-testid="sh-request-delete-contact-button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
));
ContactDisplay.displayName = 'ContactDisplay';
const LineItemsDisplay = React.memo<{
lineItems: LineItem[];
isSubmitted: boolean;
onAddLineItems: () => void;
onDeleteLineItem: (index: number) => void;
}>(({ lineItems, isSubmitted, onAddLineItems, onDeleteLineItem }) => (
  <div className="space-y-2" data-testid="sh-request-lineitems-display">
    {lineItems.map((item, index) => (
      <div 
        key={`${item.pipedriveProductId}-${index}`}
        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
      >
        <Package className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-600">
            Qty: {item.quantity}
            {item.price && ` • R${item.price.toFixed(2)}`}
          </p>
          {item.customDescription && (
            <p className="text-xs text-gray-500">{item.customDescription}</p>
          )}
        </div>
        {!isSubmitted && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddLineItems}
              data-testid="sh-request-edit-lineitems-button"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteLineItem(index)}
              data-testid={`sh-request-delete-lineitem-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    ))}
    {!isSubmitted && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddLineItems}
        data-testid="sh-request-add-more-items-button"
      >
        <Package className="h-4 w-4 mr-2" />
        Add More Items
      </Button>
    )}
  </div>
));
LineItemsDisplay.displayName = 'LineItemsDisplay';
const CommentSection = React.memo<{
comment?: string;
isSubmitted: boolean;
isEditing: boolean;
commentValue: string;
onEdit: () => void;
onBlur: () => void;
onCancel: () => void;
onChange: (value: string) => void;
}>(({ comment, isSubmitted, isEditing, commentValue, onEdit, onBlur, onCancel, onChange }) => {
if (isEditing) {
return (
<div className="space-y-2">
<Textarea
value={commentValue}
onChange={(e) => onChange(e.target.value)}
onBlur={onBlur}
placeholder="Add a comment..."
className="min-h-[80px]"
data-testid="sh-request-comment-input"
autoFocus
/>
<div className="flex gap-2">
<Button size="sm" onClick={onBlur}>
Save
</Button>
<Button size="sm" variant="ghost" onClick={onCancel}>
Cancel
</Button>
</div>
</div>
);
}
if (comment) {
return (
<div
className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer"
onClick={() => !isSubmitted && onEdit()}
data-testid="sh-request-comment-display"
>
<MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
<div className="flex-1">
<p className="text-sm">{comment}</p>
{!isSubmitted && (
<p className="text-xs text-gray-500 mt-1">Click to edit</p>
)}
</div>
</div>
);
}
if (!isSubmitted) {
return (
<Button
     variant="outline"
     className="w-full"
     onClick={onEdit}
     data-testid="sh-request-add-comment-button"
   >
<MessageSquare className="h-4 w-4 mr-2" />
Add Comment
</Button>
);
}
return null;
});
CommentSection.displayName = 'CommentSection';
export const RequestCardOptimized: React.FC<RequestCardOptimizedProps> = ({
request,
onUpdate,
onDelete,
onAddContact,
onAddLineItems,
onSubmit,
onUpdateInline,
salesperson,
showNewButton
}) => {
const [isEditingComment, setIsEditingComment] = useState(false);
const [commentValue, setCommentValue] = useState(request.comment || '');
const [isSubmitting, setIsSubmitting] = useState(false);
// Memoized callbacks to prevent unnecessary re-renders
const handleCommentBlur = useCallback(async () => {
if (commentValue.trim() !== request.comment) {
await onUpdateInline(request.id, 'comment', commentValue.trim());
}
setIsEditingComment(false);
}, [commentValue, request.comment, request.id, onUpdateInline]);
const handleCommentCancel = useCallback(() => {
setCommentValue(request.comment || '');
setIsEditingComment(false);
}, [request.comment]);
const handleSubmit = useCallback(async () => {
setIsSubmitting(true);
try {
await onSubmit(request.id);
} finally {
setIsSubmitting(false);
}
}, [onSubmit, request.id]);
const handleAddContact = useCallback(() => {
onAddContact(request.id);
}, [onAddContact, request.id]);
const handleAddLineItems = useCallback(() => {
onAddLineItems(request.id);
}, [onAddLineItems, request.id]);
const handleDelete = useCallback(() => {
onDelete(request.id);
}, [onDelete, request.id]);
const handleDeleteContact = useCallback(async () => {
await onUpdateInline(request.id, 'contact', null);
}, [onUpdateInline, request.id]);
const handleDeleteLineItem = useCallback(async (index: number) => {
const newItems = request.line_items.filter((_, i) => i !== index);
await onUpdateInline(request.id, 'line_items', newItems);
}, [onUpdateInline, request.id, request.line_items]);
// Memoized computed values
const canSubmit = useMemo(() =>
request.contact && request.line_items.length > 0,
[request.contact, request.line_items.length]
);
const isSubmitted = useMemo(() =>
request.status === 'submitted',
[request.status]
);
const isFailed = useMemo(() =>
request.status === 'failed',
[request.status]
);
const statusBadgeVariant = useMemo(() => {
switch (request.status) {
case 'submitted': return 'default';
case 'failed': return 'destructive';
default: return 'secondary';
}
}, [request.status]);
const dealUrl = useMemo(() => {
if (!request.pipedrive_deal_id) return '#';
const submitMode = process.env.NEXT_PUBLIC_PIPEDRIVE_SUBMIT_MODE || 'real';
if (submitMode === 'mock') {
  return `#mock-deal-${request.pipedrive_deal_id}`;
}
return `https://yourcompany.pipedrive.com/deal/${request.pipedrive_deal_id}`;
}, [request.pipedrive_deal_id]);
const validationMessage = useMemo(() => {
if (canSubmit || isSubmitted || isFailed) return null;
if (!request.contact && !request.line_items.length) {
  return 'Add contact and line items to submit';
}
if (!request.contact) return 'Add contact to submit';
return 'Add line items to submit';
}, [canSubmit, isSubmitted, isFailed, request.contact, request.line_items.length]);
return (
<Card className="p-4 mb-4" data-testid="sh-request-card" data-status={request.status}>
{/* Header with QR ID and Status - PRD compliant */}
<div className="flex justify-between items-start mb-4">
<div>
<div className="flex items-center gap-2 mb-1">
<span 
           className="font-mono text-lg font-semibold"
           data-testid="sh-request-id"
         >
{request.request_id}
</span>
<Badge 
           variant={statusBadgeVariant}
           data-testid="sh-request-status-badge"
         >
{request.status}
</Badge>
</div>
{request.salesperson_first_name && (
<p className="text-sm text-gray-600">
by {request.salesperson_first_name}
</p>
)}
</div>
    {!isSubmitted && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        data-testid="sh-request-delete-button"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>

  {/* Contact Section */}
  <div className="mb-4">
    {request.contact ? (
      <ContactDisplay
        contact={request.contact}
        isSubmitted={isSubmitted}
        onAddContact={handleAddContact}
        onDeleteContact={handleDeleteContact}
      />
    ) : (
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddContact}
        data-testid="sh-request-add-contact-button"
      >
        <User className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
    )}
  </div>

  {/* Line Items Section */}
  <div className="mb-4">
    {request.line_items.length > 0 ? (
      <LineItemsDisplay
        lineItems={request.line_items}
        isSubmitted={isSubmitted}
        onAddLineItems={handleAddLineItems}
        onDeleteLineItem={handleDeleteLineItem}
      />
    ) : (
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddLineItems}
        data-testid="sh-request-add-lineitem-button"
      >
        <Package className="h-4 w-4 mr-2" />
        Add Line Items
      </Button>
    )}
  </div>

  {/* Comment Section */}
  <div className="mb-4">
    <CommentSection
      comment={request.comment}
      isSubmitted={isSubmitted}
      isEditing={isEditingComment}
      commentValue={commentValue}
      onEdit={() => setIsEditingComment(true)}
      onBlur={handleCommentBlur}
      onCancel={handleCommentCancel}
      onChange={setCommentValue}
    />
  </div>

  {/* Action Buttons - PRD submit button logic */}
  <div className="flex gap-2">
    {isSubmitted ? (
      <Button
        variant="default"
        className="flex-1"
        onClick={() => window.open(dealUrl, '_blank')}
        data-testid="sh-request-see-deal-button"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        See Deal
      </Button>
    ) : isFailed ? (
      <Button
        variant="destructive"
        className="flex-1"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        data-testid="sh-request-retry-button"
      >
        {isSubmitting ? 'Retrying...' : 'Retry Submission'}
      </Button>
    ) : (
      <Button
        variant="default"
        className="flex-1"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        data-testid="sh-request-submit-button"
      >
        {isSubmitting ? 'Submitting...' : 'Submit to Pipedrive'}
      </Button>
    )}
  </div>

  {/* Validation Messages */}
  {validationMessage && (
    <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
      {validationMessage}
    </div>
  )}
</Card>
);
};
Create /app/types/index.ts for shared interfaces:
export interface LineItem {
pipedriveProductId: number;
name: string;
quantity: number;
price?: number;
customDescription?: string;
}
export interface Contact {
personId: number;
name: string;
email?: string;
phone?: string;
orgId?: number;
orgName?: string;
mineGroup?: string;
mineName?: string;
}
export interface Request {
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
export interface Product {
pipedriveProductId: number;
name: string;
code?: string;
price?: number;
shortDescription?: string;
}
export interface ProductWithQuantity extends Product {
quantity: number;
customDescription?: string;
}
export interface ContactsData {
[mineGroup: string]: {
[mineName: string]: Contact[];
};
}
export interface ProductsData {
[category: string]: Product[];
}
export interface ApiResponse<T = any> {
ok: boolean;
data?: T;
message?: string;
stale?: boolean;
}
Create /app/hooks/useSessionStorage.ts for better state management:
import { useState, useEffect } from 'react';
export function useSessionStorage<T>(key: string, initialValue: T) {
const [storedValue, setStoredValue] = useState<T>(() => {
if (typeof window === 'undefined') {
return initialValue;
}
try {
const item = window.sessionStorage.getItem(key);
return item ? JSON.parse(item) : initialValue;
} catch (error) {
console.error(Error reading sessionStorage key "${key}":, error);
return initialValue;
}
});
const setValue = (value: T | ((val: T) => T)) => {
try {
const valueToStore = value instanceof Function ? value(storedValue) : value;
setStoredValue(valueToStore);
if (typeof window !== 'undefined') {
window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
}
} catch (error) {
console.error(Error setting sessionStorage key "${key}":, error);
}
};
const removeValue = () => {
try {
setStoredValue(initialValue);
if (typeof window !== 'undefined') {
window.sessionStorage.removeItem(key);
}
} catch (error) {
console.error(Error removing sessionStorage key "${key}":, error);
}
};
return [storedValue, setValue, removeValue] as const;
}
Create /app/hooks/useApi.ts for standardized API calls:
import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types';
export function useApi<T = any>() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const execute = useCallback(async (
url: string,
options: RequestInit = {}
): Promise<ApiResponse<T>> => {
setLoading(true);
setError(null);
try {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!data.ok) {
    setError(data.message || 'Request failed');
  }

  return data;
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  setError(errorMessage);
  return {
    ok: false,
    message: errorMessage,
  };
} finally {
  setLoading(false);
}
}, []);
return { execute, loading, error };
}
Create /app/components/ErrorBoundary.tsx for better error handling:
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
interface ErrorBoundaryState {
hasError: boolean;
error?: Error;
}
interface ErrorBoundaryProps {
children: React.ReactNode;
fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
constructor(props: ErrorBoundaryProps) {
super(props);
this.state = { hasError: false };
}
static getDerivedStateFromError(error: Error): ErrorBoundaryState {
return { hasError: true, error };
}
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
console.error('ErrorBoundary caught an error:', error, errorInfo);
}
resetError = () => {
this.setState({ hasError: false, error: undefined });
};
render() {
if (this.state.hasError) {
if (this.props.fallback) {
const FallbackComponent = this.props.fallback;
return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
}
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          {this.state.error?.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={this.resetError} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

return this.props.children;
}
}
export default ErrorBoundary;
Create /app/utils/performance.ts for performance utilities:
import { useEffect, useRef, useState } from 'react';
// Debounce hook for search inputs
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
// Performance monitoring
export function usePerformanceMonitor(componentName: string) {
const renderCount = useRef(0);
const startTime = useRef(Date.now());
useEffect(() => {
renderCount.current += 1;
const renderTime = Date.now() - startTime.current;
if (process.env.NODE_ENV === 'development') {
  console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`);
}

startTime.current = Date.now();
});
return renderCount.current;
}
// Virtual scrolling for large lists
export function useVirtualizedList<T>(
items: T[],
itemHeight: number,
containerHeight: number
) {
const [scrollTop, setScrollTop] = useState(0);
const startIndex = Math.floor(scrollTop / itemHeight);
const endIndex = Math.min(
startIndex + Math.ceil(containerHeight / itemHeight) + 1,
items.length
);
const visibleItems = items.slice(startIndex, endIndex);
const totalHeight = items.length * itemHeight;
const offsetY = startIndex * itemHeight;
return {
visibleItems,
totalHeight,
offsetY,
setScrollTop,
};
}
Update the main RequestCard to use optimized version and add tests.
Create /__tests__/components/RequestCard.test.tsx:
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestCardOptimized } from '@/components/RequestCardOptimized';
import { Request } from '@/types';
const mockRequest: Request = {
id: 'test-id',
request_id: 'QR-001',
status: 'draft',
salesperson_first_name: 'John',
contact: {
personId: 1,
name: 'Test Contact',
email: 'test@example.com',
mineGroup: 'Test Group',
mineName: 'Test Mine'
},
line_items: [
{
pipedriveProductId: 1,
name: 'Test Product',
quantity: 2,
price: 100
}
],
comment: 'Test comment',
created_at: '2025-08-15T10:00:00Z',
updated_at: '2025-08-15T10:00:00Z'
};
const mockProps = {
onUpdate: jest.fn(),
onDelete: jest.fn(),
onAddContact: jest.fn(),
onAddLineItems: jest.fn(),
onSubmit: jest.fn(),
onUpdateInline: jest.fn(),
salesperson: 'John',
showNewButton: true
};
describe('RequestCardOptimized', () => {
beforeEach(() => {
jest.clearAllMocks();
});
it('renders request information correctly', () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
expect(screen.getByTestId('sh-request-id')).toHaveTextContent('QR-001');
expect(screen.getByTestId('sh-request-status-badge')).toHaveTextContent('draft');
expect(screen.getByText('Test Contact')).toBeInTheDocument();
expect(screen.getByText('Test Product')).toBeInTheDocument();
});
it('handles inline comment editing with auto-save', async () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
fireEvent.click(screen.getByTestId('sh-request-comment-display'));

const textarea = screen.getByTestId('sh-request-comment-input');
fireEvent.change(textarea, { target: { value: 'Updated comment' } });

fireEvent.blur(textarea);

await waitFor(() => {
  expect(mockProps.onUpdateInline).toHaveBeenCalledWith('test-id', 'comment', 'Updated comment');
});
});
it('handles contact deletion inline', async () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
fireEvent.click(screen.getByTestId('sh-request-delete-contact-button'));

await waitFor(() => {
  expect(mockProps.onUpdateInline).toHaveBeenCalledWith('test-id', 'contact', null);
});
});
it('handles line item deletion inline', async () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
fireEvent.click(screen.getByTestId('sh-request-delete-lineitem-0'));

await waitFor(() => {
  expect(mockProps.onUpdateInline).toHaveBeenCalledWith('test-id', 'line_items', []);
});
});
it('handles submission for draft requests', async () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
fireEvent.click(screen.getByTestId('sh-request-submit-button'));

await waitFor(() => {
  expect(mockProps.onSubmit).toHaveBeenCalledWith('test-id');
});
});
it('shows retry button for failed requests', () => {
const failedRequest = { ...mockRequest, status: 'failed' as const };
render(<RequestCardOptimized request={failedRequest} {...mockProps} />);
expect(screen.getByTestId('sh-request-retry-button')).toBeInTheDocument();
});
it('shows deal link for submitted requests', () => {
const submittedRequest = {
...mockRequest,
status: 'submitted' as const,
pipedrive_deal_id: 12345
};
render(<RequestCardOptimized request={submittedRequest} {...mockProps} />);
expect(screen.getByTestId('sh-request-see-deal-button')).toBeInTheDocument();
});
it('prevents submission when required fields are missing', () => {
const incompleteRequest = {
...mockRequest,
contact: undefined,
line_items: []
};
render(<RequestCardOptimized request={incompleteRequest} {...mockProps} />);
const submitButton = screen.getByTestId('sh-request-submit-button');
expect(submitButton).toBeRetryJContinueEditDisabled();
expect(screen.getByText('Add contact and line items to submit')).toBeInTheDocument();
});
it('uses large QR-xxx font size as per PRD', () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
const requestId = screen.getByTestId('sh-request-id');
expect(requestId).toHaveClass('text-lg');
});
it('handles PRD-compliant inline editing workflows', async () => {
render(<RequestCardOptimized request={mockRequest} {...mockProps} />);
// Test contact editing button
fireEvent.click(screen.getByTestId('sh-request-change-contact-button'));
expect(mockProps.onAddContact).toHaveBeenCalledWith('test-id');

// Test line items editing button
fireEvent.click(screen.getByTestId('sh-request-edit-lineitems-button'));
expect(mockProps.onAddLineItems).toHaveBeenCalledWith('test-id');
});
});
Create /__tests__/hooks/useApi.test.tsx:
import { renderHook, act } from '@testing-library/react';
import { useApi } from '@/hooks/useApi';
// Mock fetch
global.fetch = jest.fn();
describe('useApi', () => {
beforeEach(() => {
jest.clearAllMocks();
});
it('handles successful API calls', async () => {
const mockResponse = { ok: true, data: { test: 'data' } };
(fetch as jest.Mock).mockResolvedValueOnce({
json: () => Promise.resolve(mockResponse)
});
const { result } = renderHook(() => useApi());

let response;
await act(async () => {
  response = await result.current.execute('/api/test');
});

expect(fetch).toHaveBeenCalledWith('/api/test', {
  headers: { 'Content-Type': 'application/json' }
});
expect(response).toEqual(mockResponse);
expect(result.current.loading).toBe(false);
expect(result.current.error).toBe(null);
});
it('handles API errors', async () => {
const errorMessage = 'API Error';
(fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
const { result } = renderHook(() => useApi());

let response;
await act(async () => {
  response = await result.current.execute('/api/test');
});

expect(result.current.error).toBe(errorMessage);
expect(response?.ok).toBe(false);
});
it('sets loading state correctly', async () => {
(fetch as jest.Mock).mockImplementationOnce(() =>
new Promise(resolve => setTimeout(() => resolve({
json: () => Promise.resolve({ ok: true })
}), 100))
);
const { result } = renderHook(() => useApi());

act(() => {
  result.current.execute('/api/test');
});

expect(result.current.loading).toBe(true);

await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 150));
});

expect(result.current.loading).toBe(false);
});
});
Create /__tests__/components/ContactSelector.test.tsx:
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactSelector } from '@/components/ContactSelector';
const mockContactsData = {
'Mining Group A': {
'Mine 1': [
{
personId: 1,
name: 'John Doe',
email: 'john@example.com',
mineGroup: 'Mining Group A',
mineName: 'Mine 1'
}
]
}
};
// Mock fetch
global.fetch = jest.fn();
describe('ContactSelector', () => {
beforeEach(() => {
jest.clearAllMocks();
(fetch as jest.Mock).mockResolvedValue({
json: () => Promise.resolve({ ok: true, data: mockContactsData })
});
});
it('loads and displays contacts', async () => {
const onSelectContact = jest.fn();
render(<ContactSelector onSelectContact={onSelectContact} />);
await waitFor(() => {
  expect(screen.getByText('Mining Group A')).toBeInTheDocument();
});

// Expand group
fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));

await waitFor(() => {
  expect(screen.getByText('Mine 1')).toBeInTheDocument();
});

// Expand mine
fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));

await waitFor(() => {
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
});
it('handles contact selection', async () => {
const onSelectContact = jest.fn();
render(<ContactSelector onSelectContact={onSelectContact} />);
await waitFor(() => {
  expect(screen.getByText('Mining Group A')).toBeInTheDocument();
});

// Navigate to contact
fireEvent.click(screen.getByTestId('sh-contact-group-mining-group-a'));
fireEvent.click(screen.getByTestId('sh-contact-mine-mining-group-a-mine-1'));

await waitFor(() => {
  const contact = screen.getByTestId('sh-contact-1');
  fireEvent.click(contact);
});

expect(onSelectContact).toHaveBeenCalledWith({
  personId: 1,
  name: 'John Doe',
  email: 'john@example.com',
  mineGroup: 'Mining Group A',
  mineName: 'Mine 1'
});
});
it('handles search functionality', async () => {
const onSelectContact = jest.fn();
render(<ContactSelector onSelectContact={onSelectContact} />);
await waitFor(() => {
  expect(screen.getByText('Mining Group A')).toBeInTheDocument();
});

const searchInput = screen.getByTestId('sh-contact-search');
fireEvent.change(searchInput, { target: { value: 'John' } });

// Search should filter the contacts
expect(searchInput).toHaveValue('John');
});
it('displays stale data warning', async () => {
(fetch as jest.Mock).mockResolvedValueOnce({
json: () => Promise.resolve({ ok: true, data: mockContactsData, stale: true })
});
const onSelectContact = jest.fn();
render(<ContactSelector onSelectContact={onSelectContact} />);

await waitFor(() => {
  expect(screen.getByText(/Using offline data/)).toBeInTheDocument();
});
});
it('handles API errors gracefully', async () => {
(fetch as jest.Mock).mockResolvedValueOnce({
json: () => Promise.resolve({ ok: false, message: 'API Error' })
});
const onSelectContact = jest.fn();
render(<ContactSelector onSelectContact={onSelectContact} />);

await waitFor(() => {
  expect(screen.getByText('API Error')).toBeInTheDocument();
  expect(screen.getByText('Try Again')).toBeInTheDocument();
});
});
});
Create /__tests__/utils/performance.test.tsx:
import { renderHook, act } from '@testing-library/react';
import { useDebounce, usePerformanceMonitor } from '@/utils/performance';
describe('Performance utilities', () => {
describe('useDebounce', () => {
jest.useFakeTimers();
it('debounces value changes', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );

  expect(result.current).toBe('initial');

  // Change value
  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial'); // Still initial

  // Fast forward time
  act(() => {
    jest.advanceTimersByTime(500);
  });

  expect(result.current).toBe('updated');
});

it('cancels previous timeout on rapid changes', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'first', delay: 500 } }
  );

  rerender({ value: 'second', delay: 500 });
  
  act(() => {
    jest.advanceTimersByTime(250);
  });

  rerender({ value: 'third', delay: 500 });

  act(() => {
    jest.advanceTimersByTime(500);
  });

  expect(result.current).toBe('third');
});

jest.useRealTimers();
});
describe('usePerformanceMonitor', () => {
it('tracks render count', () => {
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  const { result, rerender } = renderHook(() => 
    usePerformanceMonitor('TestComponent')
  );

  expect(result.current).toBe(1);

  rerender();
  expect(result.current).toBe(2);

  rerender();
  expect(result.current).toBe(3);

  consoleSpy.mockRestore();
});
});
});
Create /__tests__/integration/mainPage.test.tsx:
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from '@/app/page';
// Mock Next.js router
jest.mock('next/navigation', () => ({
useRouter: () => ({
push: jest.fn(),
}),
}));
// Mock fetch
global.fetch = jest.fn();
const mockRequests = [
{
id: 'req-1',
request_id: 'QR-001',
status: 'draft',
salesperson_first_name: 'James',
contact: {
personId: 1,
name: 'Test Contact',
mineGroup: 'Group A',
mineName: 'Mine 1'
},
line_items: [
{
pipedriveProductId: 1,
name: 'Product 1',
quantity: 2,
price: 100
}
],
created_at: '2025-08-15T10:00:00Z',
updated_at: '2025-08-15T10:00:00Z'
}
];
describe('MainPage Integration', () => {
beforeEach(() => {
jest.clearAllMocks();
(fetch as jest.Mock).mockResolvedValue({
json: () => Promise.resolve({ ok: true, data: mockRequests })
});
});
it('loads and displays requests correctly', async () => {
render(<MainPage />);
await waitFor(() => {
  expect(screen.getByText('QR-001')).toBeInTheDocument();
  expect(screen.getByText('Test Contact')).toBeInTheDocument();
});
});
it('follows PRD navigation patterns', async () => {
render(<MainPage />);
// Should default to James, not "all"
expect(screen.getByDisplayValue('James')).toBeInTheDocument();

// Should show New Request button for specific salesperson
await waitFor(() => {
  expect(screen.getByTestId('sh-main-new-request-button')).toBeInTheDocument();
});

// Switch to "All Requests" - should hide New Request button
const salespersonFilter = screen.getByTestId('sh-main-salesperson-filter');
fireEvent.click(salespersonFilter);

const allOption = screen.getByText('All Requests');
fireEvent.click(allOption);

expect(screen.queryByTestId('sh-main-new-request-button')).not.toBeInTheDocument();
});
it('creates new requests inline', async () => {
(fetch as jest.Mock)
.mockResolvedValueOnce({
json: () => Promise.resolve({ ok: true, data: mockRequests })
})
.mockResolvedValueOnce({
json: () => Promise.resolve({
ok: true,
data: {
id: 'new-req',
request_id: 'QR-002',
status: 'draft',
salesperson_first_name: 'James',
line_items: []
}
})
});
render(<MainPage />);

await waitFor(() => {
  const newButton = screen.getByTestId('sh-main-new-request-button');
  fireEvent.click(newButton);
});

expect(fetch).toHaveBeenCalledWith('/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    salespersonFirstName: 'James',
    line_items: []
  })
});
});
it('handles inline editing operations', async () => {
render(<MainPage />);
await waitFor(() => {
  expect(screen.getByText('QR-001')).toBeInTheDocument();
});

// Mock successful inline update
(fetch as jest.Mock).mockResolvedValueOnce({
  json: () => Promise.resolve({ ok: true, data: {} })
});

// Click comment to edit (this would be handled by RequestCard)
const commentSection = screen.getByTestId('sh-request-comment-display');
if (commentSection) {
  fireEvent.click(commentSection);
}
});
it('displays statistics correctly', async () => {
render(<MainPage />);
await waitFor(() => {
  expect(screen.getByText('Total Requests')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument(); // Total count
  expect(screen.getByText('Draft')).toBeInTheDocument();
});
});
it('handles filtering by mine group', async () => {
render(<MainPage />);
await waitFor(() => {
  expect(screen.getByTestId('sh-main-mine-filter')).toBeInTheDocument();
});

// Mine groups should be populated from loaded requests
const mineFilter = screen.getByTestId('sh-main-mine-filter');
fireEvent.click(mineFilter);

// Should show "All Mine Groups" option
expect(screen.getByText('All Mine Groups')).toBeInTheDocument();
});
});

**Manual Validation Steps:**
- [ ] Test RequestCardOptimized renders without unnecessary re-renders
- [ ] Verify memoized components prevent performance issues with large lists
- [ ] Test error boundary catches and displays errors gracefully
- [ ] Verify hooks work correctly for API calls and state management
- [ ] Test performance monitoring in development mode
- [ ] Run unit tests and verify all pass with `npm test`
- [ ] Test debounced search performs efficiently with large datasets
- [ ] Verify sessionStorage state management works correctly
- [ ] Test component accessibility with screen readers
- [ ] Verify all test data attributes are present for E2E testing
- [ ] Test PRD-compliant inline editing workflows
- [ ] Verify large QR-xxx font size matches PRD requirements
- [ ] Test auto-save comment functionality on blur
- [ ] Verify New Request button visibility follows PRD navigation patterns

**Checkbox:** - [ ] 6.3 Performance Optimization & Testing Integration Complete