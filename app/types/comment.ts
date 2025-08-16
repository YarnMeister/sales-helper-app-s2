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
