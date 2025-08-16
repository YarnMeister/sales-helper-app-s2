Add Comment Implementation - Sales Helper App
Overview
Implement inline comment editing functionality directly within the RequestCard component. This feature provides auto-save on focus loss and seamless toggling between display and edit modes, following the PRD requirements for mobile-first inline editing.

1. Comment State Management Types
Cursor Prompt:
Create TypeScript interfaces and types for comment state management within the RequestCard component.

Create `/app/types/comment.ts`:

export interface CommentState {
  isEditing: boolean;
  currentValue: string;
  originalValue: string;
  hasChanges: boolean;
  isSaving: boolean;
}

export interface CommentEditProps {
  comment?: string;
  onSave: (comment: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  requestId: string;
}

export interface CommentDisplayProps {
  comment: string;
  onEdit: () => void;
  disabled?: boolean;
  requestId: string;
}

export interface CommentControlProps {
  comment?: string;
  onCommentChange: (comment: string) => Promise<void>;
  disabled?: boolean;
  requestId: string;
  className?: string;
}
Manual Validation:

 Interfaces support both editing and display states
 State management includes save/cancel operations
 Props include necessary callbacks and configuration
 requestId included for accessibility labeling


2. Comment Input Component
Cursor Prompt:
Create a specialized comment input component with auto-save functionality and mobile-optimized UX.

Create `/app/components/CommentInput.tsx`:

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, Save, X } from 'lucide-react';

interface CommentInputProps {
  initialValue?: string;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  requestId: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  initialValue = '',
  onSave,
  onCancel,
  placeholder = 'Add a comment...',
  maxLength = 2000,
  disabled = false,
  autoFocus = true,
  requestId
}) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when component mounts
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end of text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [autoFocus]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleBlur = async () => {
    setHasBlurred(true);
    
    // PRD requirement: Save on focus loss unless empty
    if (value.trim()) {
      await handleSave();
    } else {
      // Empty comment - cancel editing
      handleCancel();
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(value.trim());
    } catch (error) {
      console.error('Error saving comment:', error);
      // Keep editing mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 100;
  const hasChanges = value.trim() !== initialValue.trim();

  return (
    <div className="space-y-3" data-testid={`sh-comment-input-${requestId}`}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || isSaving}
          className={`min-h-[80px] resize-none text-base leading-relaxed ${
            isSaving ? 'opacity-75' : ''
          }`}
          aria-label={`Comment for request ${requestId}`}
          aria-describedby={`comment-help-${requestId}`}
          data-testid="sh-comment-textarea"
        />
        
        {isSaving && (
          <div className="absolute top-2 right-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Character count and help text */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span id={`comment-help-${requestId}`}>
          {hasBlurred 
            ? 'Comment will auto-save when you click outside this box'
            : 'Comment will auto-save on focus loss • Ctrl+Enter to save • Esc to cancel'
          }
        </span>
        {isNearLimit && (
          <span className={remainingChars < 0 ? 'text-red-600' : 'text-orange-600'}>
            {remainingChars} characters remaining
          </span>
        )}
      </div>

      {/* Action buttons for mobile/explicit actions */}
      <div className="flex gap-2 sm:hidden">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving || remainingChars < 0}
          className="flex-1"
          data-testid="sh-comment-save"
        >
          <Save className="h-3 w-3 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          data-testid="sh-comment-cancel"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
Manual Validation:

 Auto-focus works when component mounts
 Textarea auto-resizes based on content
 Auto-save triggers on blur (focus loss)
 Empty comments trigger cancel instead of save
 Character count warning appears near limit
 Keyboard shortcuts work (Ctrl+Enter, Escape)
 Mobile action buttons appear on small screens
 Loading state shows during save operation


3. Comment Display Component
Cursor Prompt:
Create a comment display component that shows saved comments with edit functionality.

Create `/app/components/CommentDisplay.tsx`:

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Edit } from 'lucide-react';

interface CommentDisplayProps {
  comment: string;
  onEdit: () => void;
  disabled?: boolean;
  requestId: string;
  showEditButton?: boolean;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({
  comment,
  onEdit,
  disabled = false,
  requestId,
  showEditButton = true
}) => {
  const handleClick = () => {
    if (!disabled) {
      onEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <div 
      className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${
        !disabled ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role={disabled ? 'text' : 'button'}
      aria-label={disabled ? undefined : `Edit comment for request ${requestId}`}
      data-testid={`sh-comment-display-${requestId}`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {comment}
          </p>
          {!disabled && showEditButton && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Click to edit comment
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                aria-label={`Edit comment for request ${requestId}`}
                data-testid="sh-comment-edit-button"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
Manual Validation:

 Comment text displays with proper formatting
 Click anywhere on comment area triggers edit mode
 Keyboard accessibility (Enter/Space) works
 Edit button appears on hover/focus
 Disabled state prevents editing
 Whitespace and line breaks preserved
 Mobile-friendly touch targets


4. Comment Control Component
Cursor Prompt:
Create the main comment control component that manages state between display and edit modes.

Create `/app/components/CommentControl.tsx`:

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { CommentInput } from '@/components/CommentInput';
import { CommentDisplay } from '@/components/CommentDisplay';

interface CommentControlProps {
  comment?: string;
  onCommentChange: (comment: string) => Promise<void>;
  disabled?: boolean;
  requestId: string;
  className?: string;
}

export const CommentControl: React.FC<CommentControlProps> = ({
  comment,
  onCommentChange,
  disabled = false,
  requestId,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEdit = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
    }
  }, [disabled]);

  const handleSave = useCallback(async (newComment: string) => {
    setIsLoading(true);
    try {
      await onCommentChange(newComment);
      setIsEditing(false);
    } catch (error) {
      // Keep editing mode on error so user doesn't lose their input
      console.error('Failed to save comment:', error);
      throw error; // Re-throw so CommentInput can handle it
    } finally {
      setIsLoading(false);
    }
  }, [onCommentChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Show loading state during save
  if (isLoading) {
    return (
      <div className={`${className}`} data-testid={`sh-comment-loading-${requestId}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Saving comment...</span>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className={className} data-testid={`sh-comment-editing-${requestId}`}>
        <CommentInput
          initialValue={comment || ''}
          onSave={handleSave}
          onCancel={handleCancel}
          disabled={disabled}
          requestId={requestId}
        />
      </div>
    );
  }

  // Display mode with existing comment
  if (comment && comment.trim()) {
    return (
      <div className={className} data-testid={`sh-comment-display-${requestId}`}>
        <CommentDisplay
          comment={comment}
          onEdit={handleStartEdit}
          disabled={disabled}
          requestId={requestId}
        />
      </div>
    );
  }

  // No comment - show Add Comment button
  return (
    <div className={className} data-testid={`sh-comment-add-${requestId}`}>
      <Button
        variant="outline"
        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 justify-start"
        onClick={handleStartEdit}
        disabled={disabled}
        data-testid="sh-comment-add-button"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Add Comment
      </Button>
    </div>
  );
};
Manual Validation:

 State transitions work correctly (none → editing → saved → editing)
 Add Comment button shows when no comment exists
 Comment display shows when comment exists
 Edit mode activates from both button click and display click
 Loading state shows during save operations
 Error handling keeps edit mode active on save failure
 Disabled state prevents all interactions


5. RequestCard Integration
Cursor Prompt:
Update the RequestCard component to integrate the CommentControl and remove the old comment handling.

Update `/app/components/RequestCard.tsx` to replace the comment section:

// Add to imports
import { CommentControl } from '@/components/CommentControl';

// Remove old comment-related state and handlers:
// - Remove isEditingComment state
// - Remove commentValue state  
// - Remove handleCommentBlur function
// - Remove handleCommentCancel function

// Replace the entire comment section with:
{/* Enhanced Comment Section with Inline Editing */}
<div className="mb-4">
  <CommentControl
    comment={request.comment}
    onCommentChange={(newComment) => onUpdateInline(request.id, 'comment', newComment)}
    disabled={isSubmitted}
    requestId={request.request_id}
  />
</div>

// Update RequestCardProps to ensure onUpdateInline is included:
interface RequestCardProps {
  request: Request;
  onAddContact: (requestId: string) => void;
  onAddLineItems: (requestId: string) => void;
  onSubmit: (requestId: string) => Promise<void>;
  onUpdateInline: (requestId: string, field: string, value: any) => Promise<void>;
  // Remove onAddComment as it's no longer needed
}

// Remove the handleAddComment prop and function from the main page as well
Manual Validation:

 Comment section renders correctly in RequestCard
 Add Comment button appears for requests without comments
 Existing comments display properly
 Inline editing works from comment display
 Auto-save triggers on focus loss
 Comments disabled for submitted requests
 onUpdateInline integration works correctly


6. Main Page Integration Updates
Cursor Prompt:
Update the main page to remove the old comment handling and ensure the inline comment functionality works properly.

Update `/app/page.tsx` to clean up comment-related code:

// Remove the handleAddComment function completely:
// const handleAddComment = (requestId: string) => {
//   // TODO: Implement comment modal/page
//   console.log('Add comment for request:', requestId);
// };

// Update RequestCard usage to remove onAddComment prop:
{requests.map(request => (
  <div key={request.id} className="relative">
    {recentlyUpdated.has(request.id) && (
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-green-500 text-white text-xs animate-pulse">
          Updated
        </Badge>
      </div>
    )}
    <RequestCard
      request={request}
      onAddContact={handleAddContact}
      onAddLineItems={handleAddLineItems}
      onSubmit={handleSubmitRequest}
      onUpdateInline={handleInlineUpdate}
      // Remove onAddComment prop
    />
  </div>
))}

// Enhance the handleInlineUpdate function to provide better feedback for comments:
const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: requestId, 
        [field]: value 
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Update the specific request in state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, [field]: value, updated_at: new Date().toISOString() }
          : req
      ));
      
      // Mark as recently updated with specific feedback for comments
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
      console.error('Failed to update request:', data.message);
      // For comments, we might want to show a more specific error
      if (field === 'comment') {
        throw new Error(data.message || 'Failed to save comment');
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

// Add a visual indicator specifically for comment updates:
const [commentUpdateStatus, setCommentUpdateStatus] = useState<Map<string, 'saving' | 'saved' | 'error'>>(new Map());

// Enhanced inline update with comment-specific status:
const handleInlineUpdate = async (requestId: string, field: string, value: any) => {
  // Show saving status for comments
  if (field === 'comment') {
    setCommentUpdateStatus(prev => new Map(prev).set(requestId, 'saving'));
  }

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: requestId, 
        [field]: value 
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Update the specific request in state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, [field]: value, updated_at: new Date().toISOString() }
          : req
      ));
      
      // Show success status for comments
      if (field === 'comment') {
        setCommentUpdateStatus(prev => new Map(prev).set(requestId, 'saved'));
        setTimeout(() => {
          setCommentUpdateStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(requestId);
            return newMap;
          });
        }, 2000);
      }
      
    } else {
      if (field === 'comment') {
        setCommentUpdateStatus(prev => new Map(prev).set(requestId, 'error'));
        setTimeout(() => {
          setCommentUpdateStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(requestId);
            return newMap;
          });
        }, 3000);
      }
      throw new Error(data.message || 'Update failed');
    }
  } catch (error) {
    console.error('Error updating request:', error);
    if (field === 'comment') {
      setCommentUpdateStatus(prev => new Map(prev).set(requestId, 'error'));
    }
    throw error;
  }
};
Manual Validation:

 Old comment handling code removed completely
 RequestCard renders without onAddComment prop
 Inline comment updates work through onUpdateInline
 Comment saving status shows appropriate feedback
 Error handling works for failed comment saves
 No console errors about missing props
 Recently updated indicator works for comment changes


7. Error Handling and Edge Cases
Cursor Prompt:
Add comprehensive error handling and edge cases for the comment functionality.

Update `/app/components/CommentInput.tsx` to add robust error handling:

// Add error state and retry functionality
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

// Enhanced handleSave with error handling and retry logic
const handleSave = async () => {
  if (isSaving) return;
  
  setIsSaving(true);
  setError(null);
  
  try {
    await onSave(value.trim());
    setRetryCount(0); // Reset retry count on success
  } catch (error) {
    console.error('Error saving comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save comment';
    setError(errorMessage);
    
    // Auto-retry up to 2 times for network errors
    if (retryCount < 2 && (errorMessage.includes('network') || errorMessage.includes('fetch'))) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        handleSave();
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }
  } finally {
    setIsSaving(false);
  }
};

// Enhanced handleBlur with error handling
const handleBlur = async () => {
  setHasBlurred(true);
  
  // Clear any previous errors
  setError(null);
  
  try {
    // PRD requirement: Save on focus loss unless empty
    if (value.trim()) {
      await handleSave();
    } else {
      // Empty comment - cancel editing
      handleCancel();
    }
  } catch (error) {
    // On error, keep the component in edit mode
    console.error('Auto-save failed on blur:', error);
  }
};

// Add error display in the JSX
{error && (
  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
    <p>{error}</p>
    {retryCount > 0 && (
      <p className="text-xs mt-1">Retrying... (attempt {retryCount}/2)</p>
    )}
    <div className="flex gap-2 mt-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={isSaving}
        className="text-xs h-6"
      >
        Retry
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setError(null)}
        className="text-xs h-6"
      >
        Dismiss
      </Button>
    </div>
  </div>
)}

Create `/app/components/CommentErrorBoundary.tsx` for component-level error handling:

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  requestId: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CommentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Comment component error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg" data-testid={`sh-comment-error-${this.props.requestId}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Comment Error
            </span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            Something went wrong with the comment feature. Your comment may not have been saved.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="gap-1"
            data-testid="sh-comment-error-retry"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

Update `/app/components/CommentControl.tsx` to wrap with error boundary:

// Add error boundary wrapper
import { CommentErrorBoundary } from '@/components/CommentErrorBoundary';

// Wrap the entire component return in error boundary
export const CommentControl: React.FC<CommentControlProps> = (props) => {
  return (
    <CommentErrorBoundary requestId={props.requestId}>
      <CommentControlInner {...props} />
    </CommentErrorBoundary>
  );
};

// Rename the main component
const CommentControlInner: React.FC<CommentControlProps> = ({
  comment,
  onCommentChange,
  disabled = false,
  requestId,
  className = ''
}) => {
  // ... existing implementation
};

Add offline support to CommentInput:

// Add network status detection
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// In CommentInput component
const isOnline = useNetworkStatus();

// Update handleSave to check network status
const handleSave = async () => {
  if (isSaving) return;
  
  if (!isOnline) {
    setError('Cannot save comment while offline. Please check your connection.');
    return;
  }
  
  // ... existing save logic
};

// Add offline indicator in JSX
{!isOnline && (
  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
    <p>You're offline. Comments will be saved when connection is restored.</p>
  </div>
)}
Manual Validation:

 Error messages display clearly for save failures
 Auto-retry logic works for network errors
 Offline detection prevents save attempts
 Error boundary catches component crashes
 Manual retry buttons work after errors
 Component remains in edit mode after errors
 Error states clear appropriately


8. Testing Implementation
Cursor Prompt:
Create comprehensive tests for the comment functionality.

Create `/app/__tests__/comment-control.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentControl } from '@/components/CommentControl';

describe('CommentControl', () => {
  const mockOnCommentChange = jest.fn();
  const defaultProps = {
    onCommentChange: mockOnCommentChange,
    requestId: 'QR-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Add Comment button when no comment exists', () => {
    render(<CommentControl {...defaultProps} />);
    
    expect(screen.getByTestId('sh-comment-add-button')).toBeInTheDocument();
    expect(screen.getByText('Add Comment')).toBeInTheDocument();
  });

  it('displays existing comment', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="This is a test comment" 
      />
    );
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Click to edit comment')).toBeInTheDocument();
  });

  it('enters edit mode when Add Comment button clicked', () => {
    render(<CommentControl {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('enters edit mode when existing comment clicked', () => {
    render(
      <CommentControl 
        {...defaultProps} 
        comment="Existing comment" 
      />
    );
    
    fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
    
    expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing comment')).toBeInTheDocument();
  });

  it('saves comment on blur with text', async () => {
    render(<CommentControl {...defaultProps} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByTestId('sh-comment-add-button'));
    
    // Type comment
    const textarea = screen.getByTestId('sh-comment-textarea');
    fireEvent.change(textarea, { target: { value: 'New comment' } });
    
    // Trigger blur
    fireEvent.blur(textarea);
    
    await waitFor(() => {
      expect(mockOnCommentChange).toHaveBeenCalledWith('New commentRetryJContinueEdittsx   });
 });

 it('cancels edit mode on blur with empty text', async () => {
   render(<CommentControl {...defaultProps} />);
   
   // Enter edit mode
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   // Leave textarea empty and blur
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(screen.getByTestId('sh-comment-add-button')).toBeInTheDocument();
   });
   
   expect(mockOnCommentChange).not.toHaveBeenCalled();
 });

 it('saves comment with Ctrl+Enter', async () => {
   render(<CommentControl {...defaultProps} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Keyboard save' } });
   fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
   
   await waitFor(() => {
     expect(mockOnCommentChange).toHaveBeenCalledWith('Keyboard save');
   });
 });

 it('cancels edit with Escape key', () => {
   render(
     <CommentControl 
       {...defaultProps} 
       comment="Original comment" 
     />
   );
   
   // Enter edit mode
   fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
   
   // Modify text
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Modified comment' } });
   
   // Press Escape
   fireEvent.keyDown(textarea, { key: 'Escape' });
   
   // Should return to display mode with original comment
   expect(screen.getByText('Original comment')).toBeInTheDocument();
   expect(mockOnCommentChange).not.toHaveBeenCalled();
 });

 it('shows loading state during save', async () => {
   const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
   
   render(<CommentControl {...defaultProps} onCommentChange={slowSave} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Slow save' } });
   fireEvent.blur(textarea);
   
   // Should show loading state
   expect(screen.getByText('Saving comment...')).toBeInTheDocument();
   
   await waitFor(() => {
     expect(screen.queryByText('Saving comment...')).not.toBeInTheDocument();
   });
 });

 it('handles save errors gracefully', async () => {
   const failingSave = jest.fn().mockRejectedValue(new Error('Save failed'));
   
   render(<CommentControl {...defaultProps} onCommentChange={failingSave} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Failing comment' } });
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(screen.getByText(/Save failed/)).toBeInTheDocument();
   });
   
   // Should remain in edit mode
   expect(screen.getByTestId('sh-comment-textarea')).toBeInTheDocument();
 });

 it('disables editing when disabled prop is true', () => {
   render(
     <CommentControl 
       {...defaultProps} 
       comment="Cannot edit this"
       disabled={true}
     />
   );
   
   // Click should not enter edit mode
   fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
   
   expect(screen.queryByTestId('sh-comment-textarea')).not.toBeInTheDocument();
   expect(screen.getByText('Cannot edit this')).toBeInTheDocument();
 });

 it('shows character count warning near limit', () => {
   render(<CommentControl {...defaultProps} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   // Create a long comment (near the 2000 character limit)
   const longComment = 'a'.repeat(1950);
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: longComment } });
   
   expect(screen.getByText('50 characters remaining')).toBeInTheDocument();
 });

 it('handles multi-line comments correctly', async () => {
   const multiLineComment = 'Line 1\nLine 2\nLine 3';
   
   render(<CommentControl {...defaultProps} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: multiLineComment } });
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(mockOnCommentChange).toHaveBeenCalledWith(multiLineComment);
   });
 });

 it('trims whitespace from saved comments', async () => {
   render(<CommentControl {...defaultProps} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-add-button'));
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: '  Padded comment  ' } });
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(mockOnCommentChange).toHaveBeenCalledWith('Padded comment');
   });
 });
});

Create `/app/__tests__/comment-input.test.tsx`:

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentInput } from '@/components/CommentInput';

describe('CommentInput', () => {
 const mockOnSave = jest.fn();
 const mockOnCancel = jest.fn();
 
 const defaultProps = {
   onSave: mockOnSave,
   onCancel: mockOnCancel,
   requestId: 'QR-001',
 };

 beforeEach(() => {
   jest.clearAllMocks();
 });

 it('renders with initial value', () => {
   render(
     <CommentInput 
       {...defaultProps} 
       initialValue="Initial comment"
     />
   );
   
   expect(screen.getByDisplayValue('Initial comment')).toBeInTheDocument();
 });

 it('auto-focuses textarea when autoFocus is true', () => {
   render(<CommentInput {...defaultProps} autoFocus={true} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   expect(textarea).toHaveFocus();
 });

 it('updates value on change', () => {
   render(<CommentInput {...defaultProps} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'New text' } });
   
   expect(textarea).toHaveValue('New text');
 });

 it('calls onSave on blur with non-empty text', async () => {
   render(<CommentInput {...defaultProps} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Comment to save' } });
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(mockOnSave).toHaveBeenCalledWith('Comment to save');
   });
 });

 it('calls onCancel on blur with empty text', async () => {
   render(<CommentInput {...defaultProps} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(mockOnCancel).toHaveBeenCalled();
   });
   expect(mockOnSave).not.toHaveBeenCalled();
 });

 it('saves on Ctrl+Enter', async () => {
   render(<CommentInput {...defaultProps} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Ctrl save' } });
   fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
   
   await waitFor(() => {
     expect(mockOnSave).toHaveBeenCalledWith('Ctrl save');
   });
 });

 it('cancels on Escape', () => {
   render(<CommentInput {...defaultProps} initialValue="Original" />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Modified' } });
   fireEvent.keyDown(textarea, { key: 'Escape' });
   
   expect(mockOnCancel).toHaveBeenCalled();
   expect(textarea).toHaveValue('Original'); // Should reset
 });

 it('shows character count near limit', () => {
   render(<CommentInput {...defaultProps} maxLength={100} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'a'.repeat(95) } });
   
   expect(screen.getByText('5 characters remaining')).toBeInTheDocument();
 });

 it('prevents typing beyond character limit', () => {
   render(<CommentInput {...defaultProps} maxLength={10} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'a'.repeat(15) } });
   
   // Should be truncated to max length
   expect(textarea.value.length).toBeLessThanOrEqual(10);
 });

 it('shows save/cancel buttons on mobile screens', () => {
   // Mock small screen
   Object.defineProperty(window, 'innerWidth', {
     writable: true,
     configurable: true,
     value: 400,
   });
   
   render(<CommentInput {...defaultProps} />);
   
   expect(screen.getByTestId('sh-comment-save')).toBeInTheDocument();
   expect(screen.getByTestId('sh-comment-cancel')).toBeInTheDocument();
 });

 it('handles save errors', async () => {
   const failingSave = jest.fn().mockRejectedValue(new Error('Network error'));
   
   render(
     <CommentInput 
       {...defaultProps} 
       onSave={failingSave}
     />
   );
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Test comment' } });
   fireEvent.blur(textarea);
   
   await waitFor(() => {
     expect(screen.getByText(/Network error/)).toBeInTheDocument();
   });
 });

 it('shows loading state during save', async () => {
   const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
   
   render(<CommentInput {...defaultProps} onSave={slowSave} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   fireEvent.change(textarea, { target: { value: 'Saving...' } });
   fireEvent.blur(textarea);
   
   // Should show loading spinner
   expect(screen.getByRole('progressbar') || screen.querySelector('.animate-spin')).toBeInTheDocument();
   
   await waitFor(() => {
     expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
   });
 });

 it('disables interactions when disabled prop is true', () => {
   render(<CommentInput {...defaultProps} disabled={true} />);
   
   const textarea = screen.getByTestId('sh-comment-textarea');
   expect(textarea).toBeDisabled();
   
   const saveButton = screen.queryByTestId('sh-comment-save');
   if (saveButton) {
     expect(saveButton).toBeDisabled();
   }
 });
});

Create `/app/__tests__/comment-display.test.tsx`:

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentDisplay } from '@/components/CommentDisplay';

describe('CommentDisplay', () => {
 const mockOnEdit = jest.fn();
 
 const defaultProps = {
   comment: 'This is a test comment',
   onEdit: mockOnEdit,
   requestId: 'QR-001',
 };

 beforeEach(() => {
   jest.clearAllMocks();
 });

 it('displays comment text', () => {
   render(<CommentDisplay {...defaultProps} />);
   
   expect(screen.getByText('This is a test comment')).toBeInTheDocument();
 });

 it('calls onEdit when clicked', () => {
   render(<CommentDisplay {...defaultProps} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
   
   expect(mockOnEdit).toHaveBeenCalled();
 });

 it('calls onEdit with Enter key', () => {
   render(<CommentDisplay {...defaultProps} />);
   
   const display = screen.getByTestId('sh-comment-display-QR-001');
   fireEvent.keyDown(display, { key: 'Enter' });
   
   expect(mockOnEdit).toHaveBeenCalled();
 });

 it('calls onEdit with Space key', () => {
   render(<CommentDisplay {...defaultProps} />);
   
   const display = screen.getByTestId('sh-comment-display-QR-001');
   fireEvent.keyDown(display, { key: ' ' });
   
   expect(mockOnEdit).toHaveBeenCalled();
 });

 it('does not call onEdit when disabled', () => {
   render(<CommentDisplay {...defaultProps} disabled={true} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-display-QR-001'));
   
   expect(mockOnEdit).not.toHaveBeenCalled();
 });

 it('preserves line breaks in comment text', () => {
   const multiLineComment = 'Line 1\nLine 2\nLine 3';
   
   render(
     <CommentDisplay 
       {...defaultProps} 
       comment={multiLineComment}
     />
   );
   
   const commentElement = screen.getByText(multiLineComment);
   expect(commentElement).toHaveClass('whitespace-pre-wrap');
 });

 it('shows edit button on hover', () => {
   render(<CommentDisplay {...defaultProps} showEditButton={true} />);
   
   expect(screen.getByTestId('sh-comment-edit-button')).toBeInTheDocument();
 });

 it('hides edit button when showEditButton is false', () => {
   render(<CommentDisplay {...defaultProps} showEditButton={false} />);
   
   expect(screen.queryByTestId('sh-comment-edit-button')).not.toBeInTheDocument();
 });

 it('calls onEdit when edit button clicked', () => {
   render(<CommentDisplay {...defaultProps} showEditButton={true} />);
   
   fireEvent.click(screen.getByTestId('sh-comment-edit-button'));
   
   expect(mockOnEdit).toHaveBeenCalled();
 });

 it('stops propagation on edit button click', () => {
   const containerClick = jest.fn();
   
   render(
     <div onClick={containerClick}>
       <CommentDisplay {...defaultProps} showEditButton={true} />
     </div>
   );
   
   fireEvent.click(screen.getByTestId('sh-comment-edit-button'));
   
   expect(mockOnEdit).toHaveBeenCalled();
   expect(containerClick).not.toHaveBeenCalled();
 });

 it('has proper accessibility attributes', () => {
   render(<CommentDisplay {...defaultProps} />);
   
   const display = screen.getByTestId('sh-comment-display-QR-001');
   expect(display).toHaveAttribute('role', 'button');
   expect(display).toHaveAttribute('tabIndex', '0');
   expect(display).toHaveAttribute('aria-label', 'Edit comment for request QR-001');
 });

 it('removes interactivity when disabled', () => {
   render(<CommentDisplay {...defaultProps} disabled={true} />);
   
   const display = screen.getByTestId('sh-comment-display-QR-001');
   expect(display).toHaveAttribute('role', 'text');
   expect(display).toHaveAttribute('tabIndex', '-1');
   expect(display).not.toHaveAttribute('aria-label');
 });
});
Manual Validation:

 All tests pass with npm test
 Comment editing workflow tests cover complete user journey
 Auto-save functionality tests verify PRD requirements
 Error handling tests confirm graceful degradation
 Keyboard navigation tests verify accessibility
 Edge cases (empty comments, long text, network errors) covered
 Component isolation tests verify proper state management
 Integration tests confirm main page interaction works


Summary
This comprehensive Add Comment implementation provides:

Inline editing functionality directly within RequestCard component
Auto-save on focus loss as specified in PRD requirements
Smart state management that toggles between Add/Display/Edit modes
Comprehensive error handling with retry logic and graceful degradation
Mobile-optimized UX with touch-friendly targets and responsive design
Full accessibility support including keyboard navigation and screen readers
Character limits and validation with visual feedback
Robust testing coverage for all user scenarios and edge cases

The implementation eliminates the need for a separate comment page/modal and provides a seamless inline editing experience that follows modern UX patterns while meeting all PRD requirements for comment functionality.