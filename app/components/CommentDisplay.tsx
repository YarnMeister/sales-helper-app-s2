import React from 'react';
import { Button } from './ui/button';
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
      data-testid={`sh-comment-display-content-${requestId}`}
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
