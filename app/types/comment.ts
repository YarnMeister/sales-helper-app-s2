/**
 * @deprecated Use types from '@/types/features/sales-requests' instead
 * This file is kept for backward compatibility during migration
 */

export type {
  CommentState,
  CommentControlProps,
} from '@/types/features/sales-requests';

// These types are specific to comment components and not moved to shared types yet
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
