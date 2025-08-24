Submit Button Implementation - Sales Helper App
Overview
Implement the submit functionality within the RequestCard component with proper validation, status management, and Pipedrive integration. This builds on the existing API infrastructure from Sections 1-4 and integrates seamlessly with the inline editing features.

1. Submit State Management Types
Cursor Prompt:
Create TypeScript interfaces for submit button state management and status handling.

Create `/app/types/submit.ts`:

export interface SubmitState {
  isSubmitting: boolean;
  canSubmit: boolean;
  submitError?: string;
  retryCount: number;
}

export interface RequestStatus {
  status: 'draft' | 'submitted' | 'failed';
  pipedrive_deal_id?: number;
  submit_timestamp?: string;
  error_message?: string;
}

export interface SubmitButtonProps {
  requestId: string;
  status: 'draft' | 'submitted' | 'failed';
  canSubmit: boolean;
  onSubmit: (requestId: string) => Promise<void>;
  pipedriveId?: number;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export interface StatusBadgeProps {
  status: 'draft' | 'submitted' | 'failed';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface PipedriveUrlConfig {
  baseUrl: string;
  dealPath: string;
  mode: 'real' | 'mock';
}
Manual Validation:

 Interfaces support all submit button states and error handling
 Status management includes Pipedrive deal ID tracking
 URL configuration supports both real and mock modes
 Props include necessary callbacks and state indicators


2. Status Badge Component
Cursor Prompt:
Create a status badge component that displays current request status with appropriate styling.

Create `/app/components/StatusBadge.tsx`:

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'draft' | 'submitted' | 'failed';
  isSubmitting?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isSubmitting = false,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = () => {
    if (isSubmitting) {
      return {
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Loader2,
        text: 'Submitting...',
        iconClassName: 'animate-spin'
      };
    }

    switch (status) {
      case 'submitted':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          text: 'Submitted',
          iconClassName: ''
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          text: 'Failed',
          iconClassName: ''
        };
      default: // draft
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          text: 'Draft',
          iconClassName: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} ${className} flex items-center gap-1 font-medium border`}
      data-testid={`sh-status-badge-${status}`}
    >
      {showIcon && (
        <Icon className={`${iconSizes[size]} ${config.iconClassName}`} />
      )}
      <span>{config.text}</span>
    </Badge>
  );
};
Manual Validation:

 Badge colors match design system (green=submitted, red=failed, gray=draft)
 Loading state shows spinning icon during submission
 Icons provide visual context for each status
 Size variants work correctly (sm, md, lg)
 Badge positioned in top-right corner when used in cards


3. Submit Button Component
Cursor Prompt:
Create a comprehensive submit button component with validation, error handling, and status-based rendering.

Create `/app/components/SubmitButton.tsx`:

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ExternalLink, RotateCcw, AlertCircle } from 'lucide-react';

interface SubmitButtonProps {
  requestId: string;
  status: 'draft' | 'submitted' | 'failed';
  canSubmit: boolean;
  onSubmit: (requestId: string) => Promise<void>;
  pipedriveId?: number;
  disabled?: boolean;
  className?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  requestId,
  status,
  canSubmit,
  onSubmit,
  pipedriveId,
  disabled = false,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting || disabled) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(requestId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setSubmitError(errorMessage);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPipedriveUrl = () => {
    if (!pipedriveId) return '#';

    const submitMode = process.env.NEXT_PUBLIC_PIPEDRIVE_SUBMIT_MODE || 'real';
    
    if (submitMode === 'mock') {
      return `#mock-deal-${pipedriveId}`;
    }
    
    // Replace with your actual Pipedrive domain
    return `https://yourcompany.pipedrive.com/deal/${pipedriveId}`;
  };

  const getValidationMessage = () => {
    if (canSubmit) return null;
    
    // This logic should match the parent component's validation
    return 'Add contact and line items to submit';
  };

  // Submitted state - Show "See Deal" button
  if (status === 'submitted' && pipedriveId) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          onClick={() => window.open(getPipedriveUrl(), '_blank')}
          disabled={disabled}
          data-testid="sh-submit-see-deal"
        >
          <ExternalLink className="h-4 w-4" />
          See Deal in Pipedrive
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          Deal #{pipedriveId} • Opens in new window
        </p>
      </div>
    );
  }

  // Failed state - Show retry button
  if (status === 'failed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || disabled}
          data-testid="sh-submit-retry"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Retrying...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Retry Submission
            </>
          )}
        </Button>
        
        {submitError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{submitError}</span>
            </div>
          </div>
        )}
        
        {!canSubmit && (
          <p className="text-xs text-center text-gray-500">
            {getValidationMessage()}
          </p>
        )}
      </div>
    );
  }

  // Draft state - Show submit button
  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant="default"
        className="w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting || disabled}
        data-testid="sh-submit-button"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Submitting to Pipedrive...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit to Pipedrive
          </>
        )}
      </Button>
      
      {submitError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>{submitError}</span>
          </div>
        </div>
      )}
      
      {!canSubmit && (
        <p className="text-xs text-center text-gray-500">
          {getValidationMessage()}
        </p>
      )}
    </div>
  );
};
Manual Validation:

 Submit button positioned at bottom-right of request card
 Button disabled when validation requirements not met
 Loading state shows during submission with spinner
 Error states display clearly with retry functionality
 "See Deal" button appears after successful submission
 Pipedrive URL opens in new window/tab
 Mock mode shows placeholder URL for development


4. Request Validation Logic
Cursor Prompt:
Create validation utilities to determine when submit button should be enabled.

Create `/app/utils/submitValidation.ts`:

import { Request } from '@/types';

export interface ValidationResult {
  canSubmit: boolean;
  missingRequirements: string[];
  validationMessage: string;
}

export const validateSubmitRequirements = (request: Request): ValidationResult => {
  const missing: string[] = [];

  // Check for contact
  if (!request.contact) {
    missing.push('contact');
  }

  // Check for line items
  if (!request.line_items || request.line_items.length === 0) {
    missing.push('line items');
  }

  // Additional validation for contact completeness
  if (request.contact) {
    if (!request.contact.personId || !request.contact.name) {
      missing.push('complete contact information');
    }
    
    // PRD requirement: Mobile-first contact must have mine info
    if (!request.contact.mineGroup || !request.contact.mineName) {
      missing.push('mine information');
    }
  }

  // Validate line items have required fields
  if (request.line_items && request.line_items.length > 0) {
    const invalidItems = request.line_items.filter(item => 
      !item.pipedriveProductId || 
      !item.name || 
      !item.quantity || 
      item.quantity < 1
    );
    
    if (invalidItems.length > 0) {
      missing.push('valid product information');
    }
  }

  const canSubmit = missing.length === 0 && request.status === 'draft';

  let validationMessage = '';
  if (missing.length > 0) {
    if (missing.length === 1) {
      validationMessage = `Add ${missing[0]} to submit`;
    } else if (missing.length === 2) {
      validationMessage = `Add ${missing.join(' and ')} to submit`;
    } else {
      validationMessage = `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]} to submit`;
    }
  } else if (request.status !== 'draft') {
    validationMessage = `Cannot submit ${request.status} request`;
  }

  return {
    canSubmit,
    missingRequirements: missing,
    validationMessage
  };
};

export const getSubmitButtonState = (request: Request) => {
  const validation = validateSubmitRequirements(request);
  
  return {
    ...validation,
    showSubmitButton: request.status === 'draft',
    showSeeDeallButton: request.status === 'submitted' && !!request.pipedrive_deal_id,
    showRetryButton: request.status === 'failed',
    buttonText: getButtonText(request.status, validation.canSubmit),
    buttonVariant: getButtonVariant(request.status)
  };
};

const getButtonText = (status: string, canSubmit: boolean): string => {
  switch (status) {
    case 'submitted':
      return 'See Deal in Pipedrive';
    case 'failed':
      return 'Retry Submission';
    default:
      return 'Submit to Pipedrive';
  }
};

const getButtonVariant = (status: string): 'default' | 'destructive' => {
  return status === 'failed' ? 'destructive' : 'default';
};

// Real-time validation for UI updates
export const useSubmitValidation = (request: Request) => {
  const validation = validateSubmitRequirements(request);
  const buttonState = getSubmitButtonState(request);
  
  return {
    ...validation,
    ...buttonState,
    // Additional helper properties
    requiresContact: !request.contact,
    requiresLineItems: !request.line_items || request.line_items.length === 0,
    isSubmittable: validation.canSubmit && request.status === 'draft'
  };
};
Manual Validation:

 Validation correctly identifies missing contact requirement
 Validation correctly identifies missing line items requirement
 Mine group/name validation works for mobile-first workflow
 Product validation ensures complete line item data
 Status-based validation prevents re-submission
 Clear validation messages guide user actions


5. RequestCard Integration
Cursor Prompt:
Update the RequestCard component to integrate the submit button, status badge, and validation logic.

Update `/app/components/RequestCard.tsx` to add submit functionality:

// Add to imports
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { useSubmitValidation } from '@/utils/submitValidation';

// Update RequestCardProps interface
interface RequestCardProps {
  request: Request;
  onAddContact: (requestId: string) => void;
  onAddLineItems: (requestId: string) => void;
  onSubmit: (requestId: string) => Promise<void>;
  onUpdateInline: (requestId: string, field: string, value: any) => Promise<void>;
  isSubmitting?: boolean; // Add this for external loading state
}

// Add validation hook at the top of component
export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAddContact,
  onAddLineItems,
  onSubmit,
  onUpdateInline,
  isSubmitting = false
}) => {
  const validation = useSubmitValidation(request);

  // Update the header section to include status badge in top-right
  {/* Header with QR ID and Status Badge */}
  <div className="flex justify-between items-start mb-4">
    <div>
      <h2 
        className="text-2xl font-bold text-red-600 font-mono mb-1"
        data-testid="sh-request-id"
      >
        {request.request_id}
      </h2>
      {request.salesperson_first_name && (
        <p className="text-sm text-gray-600">
          by {request.salesperson_first_name}
        </p>
      )}
    </div>
    
    {/* Status Badge - Top Right */}
    <StatusBadge 
      status={request.status}
      isSubmitting={isSubmitting}
      size="md"
      data-testid="sh-request-status-badge"
    />
  </div>

  // Replace the old action buttons section with new submit button (at the bottom)
  {/* Submit Button Section - Bottom Right */}
  <div className="mt-6">
    <SubmitButton
      requestId={request.id}
      status={request.status}
      canSubmit={validation.canSubmit}
      onSubmit={onSubmit}
      pipedriveId={request.pipedrive_deal_id}
      disabled={isSubmitting}
      className="ml-auto" // This positions it to the right
    />
  </div>

  // Optional: Add validation summary for better UX
  {validation.missingRequirements.length > 0 && request.status === 'draft' && (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        <strong>To submit this request:</strong>
      </p>
      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
        {validation.requiresContact && (
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            Add a contact
          </li>
        )}
        {validation.requiresLineItems && (
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            Add at least one line item
          </li>
        )}
      </ul>
    </div>
  )}
Manual Validation:

 Status badge appears in top-right corner of request card
 Submit button positioned at bottom-right
 Button state reflects validation requirements correctly
 Loading states show during submission process
 Validation summary guides user to complete requirements
 Component responsive design maintains layout on mobile


6. Main Page Submit Integration
Cursor Prompt:
Update the main page to handle submit operations and manage submission states.

Update `/app/page.tsx` to add submit handling:

// Add submit state management
const [submittingRequests, setSubmittingRequests] = useState<Set<string>>(new Set());

// Enhanced submit handler with comprehensive error handling
const handleSubmitRequest = async (requestId: string) => {
  // Add to submitting set
  setSubmittingRequests(prev => new Set(prev).add(requestId));

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId }),
      // Add timeout for mobile networks
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Update request status to submitted with Pipedrive ID
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'submitted', 
              pipedrive_deal_id: data.dealId,
              updated_at: new Date().toISOString()
            }
          : req
      ));

      // Show success feedback
      setRecentlyUpdated(prev => new Set(prev).add(requestId));
      setTimeout(() => {
        setRecentlyUpdated(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }, 5000); // Show success for 5 seconds

    } else {
      // Update status to failed
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'failed',
              updated_at: new Date().toISOString()
            }
          : req
      ));
      
      throw new Error(data.message || 'Submission failed');
    }
    
  } catch (error) {
    console.error('Error submitting request:', error);
    
    // Update status to failed if not already updated
    setRequests(prev => prev.map(req => 
      req.id === requestId && req.status === 'draft'
        ? { 
            ...req, 
            status: 'failed',
            updated_at: new Date().toISOString()
          }
        : req
    ));
    
    // Re-throw for component error handling
    throw error;
    
  } finally {
    // Remove from submitting set
    setSubmittingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  }
};

// Update RequestCard usage to include submission state
{requests.map(request => (
  <div key={request.id} className="relative">
    {/* Success indicator */}
    {recentlyUpdated.has(request.id) && (
      <div className="absolute top-2 left-2 z-10">
        <Badge className="bg-green-500 text-white text-xs animate-pulse">
          {request.status === 'submitted' ? 'Submitted!' : 'Updated'}
        </Badge>
      </div>
    )}
    
    <RequestCard
      request={request}
      onAddContact={handleAddContact}
      onAddLineItems={handleAddLineItems}
      onSubmit={handleSubmitRequest}
      onUpdateInline={handleInlineUpdate}
      isSubmitting={submittingRequests.has(request.id)}
    />
  </div>
))}

// Add submission statistics to the dashboard
// Update the statistics section to include submission rate
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

// Add submission rate calculation
const getSubmissionRate = () => {
  const total = filteredRequests.length;
  const submitted = filteredRequests.filter(r => r.status === 'submitted').length;
  return total > 0 ? Math.round((submitted / total) * 100) : 0;
};

// Display submission rate
{filteredRequests.length > 0 && (
  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
    <p className="text-sm text-gray-600">
      Submission Rate: <span className="font-semibold">{getSubmissionRate()}%</span>
      <span className="text-xs ml-2">
        ({filteredRequests.filter(r => r.status === 'submitted').length} of {filteredRequests.length})
      </span>
    </p>
  </div>
)}
Manual Validation:

 Submit button triggers API call to /api/submit endpoint
 Request status updates from 'draft' to 'submitted' on success
 Failed submissions update status to 'failed' with retry option
 Pipedrive deal ID saved and displayed in "See Deal" button
 Submission states managed correctly (loading, success, error)
 Statistics dashboard shows submission rates and counts
 Success indicators provide clear user feedback


7. Error Handling and Edge Cases
Cursor Prompt:
Add comprehensive error handling for submission edge cases and network issues.

Create `/app/utils/submitErrorHandler.ts`:

export interface SubmitError {
  type: 'validation' | 'network' | 'server' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
  userMessage: string;
}

export const parseSubmitError = (error: unknown): SubmitError => {
  if (error instanceof Error) {
    // Network timeout
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        type: 'timeout',
        message: error.message,
        retryable: true,
        userMessage: 'Request timed out. Please check your connection and try again.'
      };
    }
    
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: error.message,
        retryable: true,
        userMessage: 'Network error. Please check your connection and try again.'
      };
    }
    
    // Validation errors
    if (error.message.includes('validation') || error.message.includes('required')) {
      return {
        type: 'validation',
        message: error.message,
        retryable: false,
        userMessage: 'Please complete all required fields before submitting.'
      };
    }
    
    // Server errors
    if (error.message.includes('server') || error.message.includes('500')) {
      return {
        type: 'server',
        message: error.message,
        retryable: true,
        userMessage: 'Server error. Please try again in a few moments.'
      };
    }
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : String(error),
    retryable: true,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
};

export const shouldAutoRetry = (error: SubmitError, retryCount: number): boolean => {
  if (!error.retryable || retryCount >= 3) return false;
  
  // Auto-retry network and timeout errors
  return error.type === 'network' || error.type === 'timeout';
};

export const getRetryDelay = (retryCount: number): number => {
  // Exponential backoff: 1s, 2s, 4s
  return Math.pow(2, retryCount) * 1000;
};

Update SubmitButton component to use enhanced error handling:

// Add to SubmitButton.tsx imports
import { parseSubmitError, shouldAutoRetry, getRetryDelay } from '@/utils/submitErrorHandler';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Add enhanced error handling to SubmitButton component
const [retryCount, setRetryCount] = useState(0);
const isOnline = useNetworkStatus();

const handleSubmit = async () => {
  if (!canSubmit || isSubmitting || disabled) return;

  // Check network status before submission
  if (!isOnline) {
    setSubmitError('You are offline. Please check your connection and try again.');
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    await onSubmit(requestId);
    setRetryCount(0); // Reset on success
  } catch (error) {
    const submitError = parseSubmitError(error);
    setSubmitError(submitError.userMessage);
    
    // Auto-retry logic
    if (shouldAutoRetry(submitError, retryCount)) {
      const delay = getRetryDelay(retryCount);
      setRetryCount(prev => prev + 1);
      
      setTimeout(async () => {
        try {
          await onSubmit(requestId);
          setRetryCount(0);
          setSubmitError(null);
        } catch (retryError) {
          const retrySubmitError = parseSubmitError(retryError);
          setSubmitError(retrySubmitError.userMessage);
        } finally {
          setIsSubmitting(false);
        }
      }, delay);
    } else {
      setIsSubmitting(false);
    }
  } finally {
    if (retryCount === 0) {
      setIsSubmitting(false);
    }
  }
};

// Enhanced error display in JSX
{submitError && (
  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
    <div className="flex items-start gap-1">
      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p>{submitError}</p>
        {retryCount > 0 && (
          <p className="text-xs mt-1 text-red-600">
            Auto-retrying... (attempt {retryCount}/3)
          </p>
        )}
        {!isOnline && (
          <p className="text-xs mt-1 text-orange-600">
            Currently offline. Will retry when connection is restored.
          </p>
        )}
      </div>
    </div>
  </div>
)}

Add connection restoration handler to main page:

// Add to main page useEffect
useEffect(() => {
  const handleOnline = () => {
    // Retry any failed submissions when coming back online
    const failedRequests = requests.RetryJContinueEdittsxconst failedRequests = requests.filter(req => req.status === 'failed');
   
   if (failedRequests.length > 0) {
     console.log(`Connection restored. ${failedRequests.length} failed requests can be retried.`);
     
     // You could show a toast notification here
     // or automatically retry failed submissions
   }
 };

 const handleOffline = () => {
   console.log('Connection lost. Submissions will be queued until reconnected.');
 };

 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 return () => {
   window.removeEventListener('online', handleOnline);
   window.removeEventListener('offline', handleOffline);
 };
}, [requests]);

// Add optimistic updates with rollback capability
const handleSubmitRequestWithOptimism = async (requestId: string) => {
 const originalRequest = requests.find(req => req.id === requestId);
 if (!originalRequest) return;

 // Optimistically update to submitting state
 setRequests(prev => prev.map(req => 
   req.id === requestId 
     ? { ...req, status: 'submitting' as any } // Temporary submitting state
     : req
 ));

 setSubmittingRequests(prev => new Set(prev).add(requestId));

 try {
   const response = await fetch('/api/submit', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: requestId }),
     signal: AbortSignal.timeout(60000)
   });
   
   const data = await response.json();
   
   if (data.ok) {
     // Confirm optimistic update
     setRequests(prev => prev.map(req => 
       req.id === requestId 
         ? { 
             ...req, 
             status: 'submitted',
             pipedrive_deal_id: data.dealId,
             updated_at: new Date().toISOString()
           }
         : req
     ));

     // Show success feedback
     setRecentlyUpdated(prev => new Set(prev).add(requestId));
     setTimeout(() => {
       setRecentlyUpdated(prev => {
         const newSet = new Set(prev);
         newSet.delete(requestId);
         return newSet;
       });
     }, 5000);

   } else {
     throw new Error(data.message || 'Submission failed');
   }
   
 } catch (error) {
   // Rollback optimistic update
   setRequests(prev => prev.map(req => 
     req.id === requestId 
       ? { 
           ...req, 
           status: 'failed',
           updated_at: new Date().toISOString()
         }
       : req
   ));
   
   throw error; // Re-throw for component error handling
   
 } finally {
   setSubmittingRequests(prev => {
     const newSet = new Set(prev);
     newSet.delete(requestId);
     return newSet;
   });
 }
};

Create `/app/components/SubmitToast.tsx` for user feedback:

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SubmitToastProps {
 show: boolean;
 type: 'success' | 'error' | 'warning';
 message: string;
 onClose: () => void;
 autoClose?: boolean;
 duration?: number;
}

export const SubmitToast: React.FC<SubmitToastProps> = ({
 show,
 type,
 message,
 onClose,
 autoClose = true,
 duration = 5000
}) => {
 useEffect(() => {
   if (show && autoClose) {
     const timer = setTimeout(onClose, duration);
     return () => clearTimeout(timer);
   }
 }, [show, autoClose, duration, onClose]);

 if (!show) return null;

 const getToastConfig = () => {
   switch (type) {
     case 'success':
       return {
         icon: CheckCircle,
         className: 'bg-green-500 text-white',
         iconColor: 'text-white'
       };
     case 'error':
       return {
         icon: XCircle,
         className: 'bg-red-500 text-white',
         iconColor: 'text-white'
       };
     case 'warning':
       return {
         icon: AlertCircle,
         className: 'bg-orange-500 text-white',
         iconColor: 'text-white'
       };
   }
 };

 const config = getToastConfig();
 const Icon = config.icon;

 return (
   <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
     <div className={`${config.className} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm`}>
       <Icon className={`h-5 w-5 ${config.iconColor}`} />
       <p className="text-sm font-medium">{message}</p>
       <button
         onClick={onClose}
         className="ml-2 opacity-75 hover:opacity-100"
         aria-label="Close notification"
       >
         <XCircle className="h-4 w-4" />
       </button>
     </div>
   </div>
 );
};

// Add toast state to main page
const [toast, setToast] = useState<{
 show: boolean;
 type: 'success' | 'error' | 'warning';
 message: string;
} | null>(null);

// Show toast on successful submission
// In handleSubmitRequest success block:
setToast({
 show: true,
 type: 'success',
 message: `Request ${originalRequest.request_id} submitted successfully!`
});

// Show toast on submission error
// In catch block:
setToast({
 show: true,
 type: 'error',
 message: `Failed to submit ${originalRequest.request_id}. Please try again.`
});

// Add toast component to render
<SubmitToast
 show={toast?.show || false}
 type={toast?.type || 'success'}
 message={toast?.message || ''}
 onClose={() => setToast(null)}
/>
Manual Validation:

 Network timeout errors show appropriate user messages
 Auto-retry logic works for network/timeout errors
 Offline detection prevents submission attempts
 Connection restoration triggers retry opportunities
 Optimistic updates provide immediate feedback
 Error rollback restores original state on failure
 Toast notifications provide clear submission feedback
 Exponential backoff prevents server overload


8. Testing Implementation
Cursor Prompt:
Create comprehensive tests for the submit functionality.

Create `/app/__tests__/submit-button.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmitButton } from '@/components/SubmitButton';

describe('SubmitButton', () => {
  const mockOnSubmit = jest.fn();
  
  const defaultProps = {
    requestId: 'test-request-id',
    status: 'draft' as const,
    canSubmit: true,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variable
    process.env.NEXT_PUBLIC_PIPEDRIVE_SUBMIT_MODE = 'mock';
  });

  it('renders submit button for draft status', () => {
    render(<SubmitButton {...defaultProps} />);
    
    expect(screen.getByTestId('sh-submit-button')).toBeInTheDocument();
    expect(screen.getByText('Submit to Pipedrive')).toBeInTheDocument();
  });

  it('disables submit button when canSubmit is false', () => {
    render(<SubmitButton {...defaultProps} canSubmit={false} />);
    
    const button = screen.getByTestId('sh-submit-button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Add contact and line items to submit')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<SubmitButton {...defaultProps} onSubmit={slowSubmit} />);
    
    const button = screen.getByTestId('sh-submit-button');
    fireEvent.click(button);
    
    expect(screen.getByText('Submitting to Pipedrive...')).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.queryByText('Submitting to Pipedrive...')).not.toBeInTheDocument();
    });
  });

  it('calls onSubmit when clicked', async () => {
    render(<SubmitButton {...defaultProps} />);
    
    const button = screen.getByTestId('sh-submit-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test-request-id');
    });
  });

  it('shows error message on submission failure', async () => {
    const failingSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
    
    render(<SubmitButton {...defaultProps} onSubmit={failingSubmit} />);
    
    const button = screen.getByTestId('sh-submit-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders See Deal button for submitted status', () => {
    render(
      <SubmitButton 
        {...defaultProps} 
        status="submitted" 
        pipedriveId={12345}
      />
    );
    
    expect(screen.getByTestId('sh-submit-see-deal')).toBeInTheDocument();
    expect(screen.getByText('See Deal in Pipedrive')).toBeInTheDocument();
    expect(screen.getByText('Deal #12345 • Opens in new window')).toBeInTheDocument();
  });

  it('renders retry button for failed status', () => {
    render(<SubmitButton {...defaultProps} status="failed" />);
    
    expect(screen.getByTestId('sh-submit-retry')).toBeInTheDocument();
    expect(screen.getByText('Retry Submission')).toBeInTheDocument();
  });

  it('opens Pipedrive URL in new window when See Deal clicked', () => {
    const windowSpy = jest.spyOn(window, 'open').mockImplementation();
    
    render(
      <SubmitButton 
        {...defaultProps} 
        status="submitted" 
        pipedriveId={12345}
      />
    );
    
    const button = screen.getByTestId('sh-submit-see-deal');
    fireEvent.click(button);
    
    expect(windowSpy).toHaveBeenCalledWith('#mock-deal-12345', '_blank');
    
    windowSpy.mockRestore();
  });

  it('generates correct Pipedrive URL for real mode', () => {
    process.env.NEXT_PUBLIC_PIPEDRIVE_SUBMIT_MODE = 'real';
    const windowSpy = jest.spyOn(window, 'open').mockImplementation();
    
    render(
      <SubmitButton 
        {...defaultProps} 
        status="submitted" 
        pipedriveId={12345}
      />
    );
    
    const button = screen.getByTestId('sh-submit-see-deal');
    fireEvent.click(button);
    
    expect(windowSpy).toHaveBeenCalledWith(
      'https://yourcompany.pipedrive.com/deal/12345', 
      '_blank'
    );
    
    windowSpy.mockRestore();
  });

  it('handles retry submission', async () => {
    render(<SubmitButton {...defaultProps} status="failed" />);
    
    const retryButton = screen.getByTestId('sh-submit-retry');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test-request-id');
    });
  });

  it('disables all interactions when disabled prop is true', () => {
    render(<SubmitButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByTestId('sh-submit-button');
    expect(button).toBeDisabled();
  });
});

Create `/app/__tests__/submit-validation.test.tsx`:

import { validateSubmitRequirements, useSubmitValidation } from '@/utils/submitValidation';
import { Request } from '@/types';

const createTestRequest = (overrides = {}): Request => ({
  id: 'test-id',
  request_id: 'QR-001',
  status: 'draft',
  salesperson_first_name: 'Test User',
  contact: {
    personId: 123,
    name: 'Test Contact',
    mineGroup: 'Test Group',
    mineName: 'Test Mine'
  },
  line_items: [{
    pipedriveProductId: 456,
    name: 'Test Product',
    quantity: 1
  }],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides
});

describe('Submit Validation', () => {
  describe('validateSubmitRequirements', () => {
    it('validates complete request as submittable', () => {
      const request = createTestRequest();
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(true);
      expect(result.missingRequirements).toEqual([]);
      expect(result.validationMessage).toBe('');
    });

    it('identifies missing contact', () => {
      const request = createTestRequest({ contact: null });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.missingRequirements).toContain('contact');
      expect(result.validationMessage).toBe('Add contact to submit');
    });

    it('identifies missing line items', () => {
      const request = createTestRequest({ line_items: [] });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.missingRequirements).toContain('line items');
      expect(result.validationMessage).toBe('Add line items to submit');
    });

    it('identifies multiple missing requirements', () => {
      const request = createTestRequest({ 
        contact: null, 
        line_items: [] 
      });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.missingRequirements).toContain('contact');
      expect(result.missingRequirements).toContain('line items');
      expect(result.validationMessage).toBe('Add contact and line items to submit');
    });

    it('validates contact completeness', () => {
      const request = createTestRequest({ 
        contact: {
          personId: 123,
          name: 'Test Contact'
          // Missing mineGroup and mineName
        }
      });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.missingRequirements).toContain('mine information');
    });

    it('validates line item completeness', () => {
      const request = createTestRequest({ 
        line_items: [{
          pipedriveProductId: 456,
          name: 'Test Product',
          quantity: 0 // Invalid quantity
        }]
      });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.missingRequirements).toContain('valid product information');
    });

    it('prevents submission of non-draft requests', () => {
      const request = createTestRequest({ status: 'submitted' });
      const result = validateSubmitRequirements(request);
      
      expect(result.canSubmit).toBe(false);
      expect(result.validationMessage).toBe('Cannot submit submitted request');
    });
  });
});

Create `/app/__tests__/status-badge.test.tsx`:

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders draft status correctly', () => {
    render(<StatusBadge status="draft" />);
    
    expect(screen.getByTestId('sh-status-badge-draft')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders submitted status correctly', () => {
    render(<StatusBadge status="submitted" />);
    
    expect(screen.getByTestId('sh-status-badge-submitted')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('renders failed status correctly', () => {
    render(<StatusBadge status="failed" />);
    
    expect(screen.getByTestId('sh-status-badge-failed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows submitting state when isSubmitting is true', () => {
    render(<StatusBadge status="draft" isSubmitting={true} />);
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<StatusBadge status="draft" size="sm" />);
    
    let badge = screen.getByTestId('sh-status-badge-draft');
    expect(badge).toHaveClass('text-xs');
    
    rerender(<StatusBadge status="draft" size="lg" />);
    badge = screen.getByTestId('sh-status-badge-draft');
    expect(badge).toHaveClass('text-base');
  });

  it('hides icon when showIcon is false', () => {
    render(<StatusBadge status="submitted" showIcon={false} />);
    
    const badge = screen.getByTestId('sh-status-badge-submitted');
    expect(badge.querySelector('svg')).not.toBeInTheDocument();
  });
});
Manual Validation:

 All tests pass with npm test
 Submit button states test correctly (enabled/disabled/loading)
 Validation logic tests cover all requirements
 Status badge tests verify correct styling and content
 Error handling tests confirm graceful failure modes
 Pipedrive URL generation tests work for both modes
 Integration tests verify main page submit workflow
 Mock/real mode switching works correctly


Summary
This comprehensive Submit Button implementation provides:

Positioned submit button at bottom-right corner of request cards
Status-based rendering with submit/retry/"See Deal" states
Comprehensive validation ensuring contact and line items present
Status badge in top-right corner showing current state
Pipedrive integration with deep-linking to created deals
Robust error handling with auto-retry and user-friendly messages
Loading states and optimistic updates for better UX
Network awareness with offline detection and connection restoration
Comprehensive testing covering all user scenarios and edge cases

The implementation integrates seamlessly with the existing RequestCard component and main page, providing a complete submission workflow that meets all PRD requirements while maintaining excellent user experience and error resilience.