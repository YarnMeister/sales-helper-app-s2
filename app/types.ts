/**
 * Application Types
 * 
 * Consolidated types for the sales helper application.
 * This file contains all the essential types needed by components
 * to avoid module resolution issues in different build environments.
 */

/**
 * Contact interface for UI components
 */
export interface Contact {
  personId: number;
  name: string;
  email?: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  mineGroup: string;
  mineName: string;
  jobTitle?: string;
}

/**
 * Product interface for UI components
 */
export interface Product {
  pipedriveProductId: number;
  name: string;
  code?: string | null;
  price?: number;
  description?: string;
  shortDescription?: string;
  showOnSalesHelper?: boolean;
}

/**
 * Line Item interface for UI components
 */
export interface LineItem {
  pipedriveProductId: number;
  name: string;
  code?: string | null;
  price?: number;
  quantity: number;
  description?: string;
  shortDescription?: string;
  customDescription?: string;
  showOnSalesHelper?: boolean;
}

/**
 * Contacts hierarchy for UI display
 */
export interface ContactsHierarchy {
  [mineGroup: string]: {
    [mineName: string]: Contact[];
  };
}

/**
 * Products hierarchy for UI display
 */
export interface ProductsHierarchy {
  [category: string]: Product[];
}

/**
 * Contact selection state for UI components
 */
export interface ContactSelectionState {
  expandedGroups: Set<string>;
  expandedMines: Set<string>;
  searchTerm: string;
}

/**
 * Product selection state for UI components
 */
export interface ProductSelectionState {
  expandedCategories: Set<string>;
  selectedProducts: Map<number, LineItem>;
  searchTerm: string;
}

/**
 * Comment state for inline editing
 */
export interface CommentState {
  isEditing: boolean;
  currentValue: string;
  originalValue: string;
  hasChanges: boolean;
  isSaving: boolean;
}

/**
 * Component Props types
 */
export interface CommentControlProps {
  comment?: string;
  onCommentChange: (comment: string) => Promise<void>;
  disabled?: boolean;
  requestId: string;
  className?: string;
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

/**
 * API Response types
 */
export interface ContactsApiResponse {
  ok: boolean;
  data: ContactsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

export interface ProductsApiResponse {
  ok: boolean;
  data: ProductsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}
