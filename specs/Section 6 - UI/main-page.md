Main Page Implementation - Sales Helper App
Overview
Implement the main page for the Sales Helper App with mobile-first design, inline editing capabilities, and PRD-compliant navigation patterns. This assumes Sections 1-4 (backend API layer) are already implemented.

1. Header Component Implementation
Cursor Prompt:
Create a shared Header component for the Sales Helper App with RTSE logo, dynamic page titles, and PRD-compliant salesperson filtering.

Create `/app/components/Header.tsx`:

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  pageTitle: string;
  selectedSalesperson: string;
  onSalespersonChange: (salesperson: string) => void;
  showNewButton: boolean;
  onNewRequest?: () => void;
  isCreating?: boolean;
}

const SALESPEOPLE = ['Luyanda', 'James', 'Stefan', 'all'];

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  selectedSalesperson,
  onSalespersonChange,
  showNewButton,
  onNewRequest,
  isCreating = false
}) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Top bar with logo and title */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
              RTSE
            </div>
            <h1 className="text-lg font-semibold text-gray-900" data-testid="sh-header-title">
              {pageTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Salesperson filter buttons */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {SALESPEOPLE.map((person) => {
            const isSelected = selectedSalesperson === person;
            const displayName = person === 'all' ? 'All requests' : person;
            
            return (
              <Button
                key={person}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSalespersonChange(person)}
                className={`flex-shrink-0 ${
                  isSelected 
                    ? person === 'all' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-gray-50'
                }`}
                data-testid={`sh-header-filter-${person}`}
              >
                {displayName}
              </Button>
            );
          })}
        </div>

        {/* New Request button - PRD: only show for specific salesperson */}
        {showNewButton && onNewRequest && (
          <div className="mt-3">
            <Button
              onClick={onNewRequest}
              disabled={isCreating}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="sh-header-new-request"
            >
              {isCreating ? 'Creating...' : '+ New Request'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
Manual Validation:

 RTSE logo displays correctly in red background
 Page title updates dynamically based on current page
 Salesperson filter buttons work with proper styling (red for "All requests", blue for individuals)
 New Request button only shows when specific salesperson selected (not "all")
 Mobile-responsive horizontal scrolling for filter buttons
 Sticky header behavior works on scroll


2. Request Card Component
Cursor Prompt:
Create a mobile-optimized RequestCard component with inline editing capabilities and PRD-compliant submit button logic.

Create `/app/components/RequestCard.tsx`:

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { User, Package, MessageSquare, ExternalLink } from 'lucide-react';

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

interface RequestCardProps {
  request: Request;
  onAddContact: (requestId: string) => void;
  onAddLineItems: (requestId: string) => void;
  onAddComment: (requestId: string) => void;
  onSubmit: (requestId: string) => Promise<void>;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAddContact,
  onAddLineItems,
  onAddComment,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRD: Submit enabled only when contact AND line items exist
  const canSubmit = request.contact && request.line_items.length > 0;
  const isSubmitted = request.status === 'submitted';
  const isFailed = request.status === 'failed';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(request.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = () => {
    switch (request.status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDealUrl = () => {
    if (!request.pipedrive_deal_id) return '#';
    return `https://yourcompany.pipedrive.com/deal/${request.pipedrive_deal_id}`;
  };

  return (
    <Card className="p-4 mb-4 shadow-sm" data-testid="sh-request-card">
      {/* Header with QR ID and Status */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 
            className="text-2xl font-bold text-red-600 font-mono"
            data-testid="sh-request-id"
          >
            {request.request_id}
          </h2>
          {request.salesperson_first_name && (
            <p className="text-sm text-gray-600 mt-1">
              by {request.salesperson_first_name}
            </p>
          )}
        </div>
        <Badge 
          className={`${getStatusBadgeColor()} border-0`}
          data-testid="sh-request-status"
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      {/* Contact Section */}
      <div className="mb-4">
        {request.contact ? (
          <div 
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
            data-testid="sh-request-contact-display"
          >
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">{request.contact.name}</p>
                {request.contact.mineGroup && request.contact.mineName && (
                  <p className="text-sm text-blue-700">
                    {request.contact.mineGroup} → {request.contact.mineName}
                  </p>
                )}
                {request.contact.email && (
                  <p className="text-xs text-blue-600">{request.contact.email}</p>
                )}
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

      {/* Line Items Section */}
      <div className="mb-4">
        {request.line_items.length > 0 ? (
          <div 
            className="bg-green-50 border border-green-200 rounded-lg p-3"
            data-testid="sh-request-items-display"
          >
            <div className="flex items-start gap-2 mb-2">
              <Package className="h-4 w-4 text-green-600 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  Items: {request.line_items.length}
                </p>
              </div>
            </div>
            <div className="space-y-1 ml-6">
              {request.line_items.map((item, index) => (
                <div key={index} className="text-sm text-green-800">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-green-600 ml-2">Qty: {item.quantity}</span>
                  {item.price && (
                    <span className="text-green-600 ml-2">
                      R{(item.price * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => onAddLineItems(request.id)}
            disabled={isSubmitted}
            data-testid="sh-request-add-items"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Line Items
          </Button>
        )}
      </div>

      {/* Comment Section */}
      <div className="mb-4">
        {request.comment ? (
          <div 
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            data-testid="sh-request-comment-display"
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-gray-600 mt-1" />
              <p className="text-sm text-gray-800 flex-1">{request.comment}</p>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => onAddComment(request.id)}
            disabled={isSubmitted}
            data-testid="sh-request-add-comment"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        )}
      </div>

      {/* Submit Button - PRD Logic */}
      <div className="space-y-2">
        {isSubmitted ? (
          <Button
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => window.open(getDealUrl(), '_blank')}
            data-testid="sh-request-see-deal"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            See Deal
          </Button>
        ) : isFailed ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            data-testid="sh-request-retry"
          >
            {isSubmitting ? 'Retrying...' : 'Retry Submission'}
          </Button>
        ) : (
          <Button
            variant="default"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            data-testid="sh-request-submit"
          >
            {isSubmitting ? 'Submitting...' : 'Submit to Pipedrive'}
          </Button>
        )}

        {/* Validation Message */}
        {!canSubmit && !isSubmitted && !isFailed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {!request.contact && !request.line_items.length 
                ? 'Add contact and line items to submit'
                : !request.contact 
                  ? 'Add contact to submit'
                  : 'Add line items to submit'
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
Manual Validation:

 QR-XXX ID displays prominently in red, large font (mobile-optimized)
 Status badge shows correct colors (green=submitted, red=failed, gray=draft)
 Submit button disabled until both contact and line items exist
 Contact section shows blue background when populated
 Line items section shows green background with item count and details
 Comment section shows gray background when populated
 Mobile-friendly compact layout with good use of whitespace
 Salesperson name displays correctly under QR ID


3. Main Page Layout and Logic
Cursor Prompt:
Create the main page component that integrates Header and RequestCard with API calls and state management following PRD requirements.

Create `/app/page.tsx`:

'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
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

export default function MainPage() {
  // PRD: Default to specific salesperson, not "all"
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('James');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // PRD: Hide New Request when "all" selected
  const showNewButton = selectedSalesperson !== 'all';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // PRD: Only filter by salesperson if not showing all
      if (selectedSalesperson !== 'all') {
        params.set('salesperson', selectedSalesperson);
      } else {
        params.set('showAll', 'true');
      }
      
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
  }, [selectedSalesperson]);

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

  const getPageTitle = () => {
    if (selectedSalesperson === 'all') {
      return 'Sales Helper - All Requests';
    }
    return `Sales Helper - ${selectedSalesperson}'s Requests`;
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="sh-main-page">
      <Header
        pageTitle={getPageTitle()}
        selectedSalesperson={selectedSalesperson}
        onSalespersonChange={setSelectedSalesperson}
        showNewButton={showNewButton}
        onNewRequest={createNewRequest}
        isCreating={isCreating}
      />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
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
            {showNewButton && (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
Manual Validation:

 Page loads with "James" selected by default (not "all")
 New Request button appears for specific salesperson, hidden for "all"
 Page title updates based on selected salesperson
 Creates new request inline on main page (no separate edit draft page)
 Requests filter correctly based on salesperson selection
 Loading state shows spinner and appropriate messaging
 Empty state shows helpful message with guidance
 Mobile-optimized container width and spacing
 SessionStorage correctly stores editingRequestId for navigation
 Submit workflow calls correct API endpoint


4. Basic Layout and Navigation Setup
Cursor Prompt:
Set up the basic layout structure and navigation routes for the Sales Helper App.

Update `/app/layout.tsx`:

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sales Helper - RTSE',
  description: 'Sales request management for mining operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}

Create placeholder pages for navigation:

Create `/app/add-contact/page.tsx`:

export default function AddContactPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Contact</h1>
      <p>Contact selection page - to be implemented</p>
    </div>
  );
}

Create `/app/add-line-items/page.tsx`:

export default function AddLineItemsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Line Items</h1>
      <p>Product selection page - to be implemented</p>
    </div>
  );
}
Manual Validation:

 Layout renders correctly with proper font loading
 Navigation to /add-contact and /add-line-items works
 Browser back button returns to main page correctly
 SessionStorage persists editingRequestId across navigation
 Page metadata displays correctly in browser tab


5. Error Handling and Loading States
Cursor Prompt:
Add comprehensive error handling and loading states to the main page components.

Create `/app/components/LoadingSpinner.tsx`:

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className="text-center py-8" data-testid="sh-loading-spinner">
      <div className={`animate-spin rounded-full border-b-2 border-red-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

Create `/app/components/ErrorMessage.tsx`:

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  showRetry = true
}) => {
  return (
    <div className="text-center py-8" data-testid="sh-error-message">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 text-lg mb-4">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

Update the main page to use these components:

// Add to imports in /app/page.tsx
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

// Add error state
const [error, setError] = useState<string | null>(null);

// Update fetchRequests function
const fetchRequests = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // ... existing fetch logic
    
  } catch (error) {
    setError('Failed to load requests. Please check your connection.');
    console.error('Error fetching requests:', error);
  } finally {
    setLoading(false);
  }
};

// Update render logic in return statement
{loading ? (
  <LoadingSpinner message="Loading your requests..." />
) : error ? (
  <ErrorMessage 
    message={error} 
    onRetry={fetchRequests}
  />
) : requests.length === 0 ? (
  // ... existing empty state
) : (
  // ... existing requests list
)}
Manual Validation:

 Loading spinner appears with appropriate messaging
 Error states display helpful messages with retry functionality
 Network errors are caught and displayed appropriately
 Retry functionality resets error state and refetches data
 Loading states prevent user interaction during async operations


Summary
This implementation provides:

Mobile-first design with sticky header and optimized card layout
PRD-compliant navigation with salesperson filtering and conditional New Request button
Inline request creation directly on main page (eliminating separate edit draft page)
Submit button logic that follows PRD requirements (disabled until contact + line items)
Clear visual hierarchy with QR-XXX IDs prominently displayed
Proper state management using sessionStorage for navigation context
Error handling and loading states for production readiness

The implementation assumes the backend API from Sections 1-4 is functional and follows the established patterns for data fetching and state management.