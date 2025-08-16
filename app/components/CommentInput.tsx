import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
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
