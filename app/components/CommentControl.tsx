import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { CommentDisplay } from './CommentDisplay';

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

  const handleSave = useCallback(async (newComment?: string) => {
    setIsLoading(true);
    try {
      // If no comment provided, get it from the textarea
      let commentToSave = newComment;
      if (!commentToSave) {
        const textarea = document.querySelector('[data-testid="sh-comment-textarea"]') as HTMLTextAreaElement;
        commentToSave = textarea?.value.trim() || '';
      }
      
      await onCommentChange(commentToSave);
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
