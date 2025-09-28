/**
 * Sales Requests Feature Types
 * 
 * Type definitions specific to the sales requests feature module.
 * These types handle the sales workflow, contacts, products, and line items.
 */

import { z } from 'zod';
import { RequestStatus, SalespersonSelection, ContactJSON, LineItemJSON } from '../shared/database';

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
 * Request interface for UI components
 */
export interface Request {
  id: string;
  requestId: string;  // QR-001 format
  status: RequestStatus;
  salespersonFirstName?: string;
  salespersonSelection?: SalespersonSelection;
  mineGroup?: string;
  mineName?: string;
  contact: Contact | null;
  lineItems: LineItem[];
  comment?: string;
  pipedriveDealId?: number;
  createdAt: string;
  updatedAt: string;
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
  selectedProducts: Map<number, LineItem>; // productId -> LineItem
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
 * Request form data for creation/updates
 */
export interface RequestFormData {
  salespersonFirstName?: string;
  salespersonSelection?: SalespersonSelection;
  mineGroup?: string;
  mineName?: string;
  contact?: Contact;
  lineItems: LineItem[];
  comment?: string;
}

/**
 * Request filters for API queries
 */
export interface RequestFilters {
  status?: RequestStatus;
  salesperson?: SalespersonSelection | 'all';
  mineGroup?: string;
  mineName?: string;
  personId?: number;
  showAll?: boolean;
  limit?: number;
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

export interface RequestsApiResponse {
  ok: boolean;
  data: Request[];
  showNewButton?: boolean;
  filters?: {
    salesperson?: string;
    showAll?: boolean;
  };
}

export interface RequestApiResponse {
  ok: boolean;
  data: Request;
}

export interface SubmitRequestResponse {
  ok: boolean;
  dealId?: number;
  message?: string;
  error?: string;
}

/**
 * Component Props types
 */
export interface ContactAccordionProps {
  contacts: ContactsHierarchy;
  selectedContact: Contact | null;
  onContactSelect: (contact: Contact) => void;
  loading?: boolean;
  error?: string;
}

export interface ProductAccordionProps {
  products: ProductsHierarchy;
  selectedProducts: Map<number, LineItem>;
  onProductSelect: (product: Product) => void;
  onQuantityChange: (productId: number, quantity: number) => void;
  loading?: boolean;
  error?: string;
}

export interface RequestCardProps {
  request: Request;
  onUpdate?: (request: Request) => void;
  onDelete?: (requestId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface CommentControlProps {
  comment?: string;
  onCommentChange: (comment: string) => Promise<void>;
  disabled?: boolean;
  requestId: string;
  className?: string;
}

export interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Hook return types
 */
export interface UseRequestFormReturn {
  formData: RequestFormData;
  updateFormData: (updates: Partial<RequestFormData>) => void;
  resetForm: () => void;
  isValid: boolean;
  errors: string[];
  isDirty: boolean;
}

export interface UseContactSearchReturn {
  contacts: ContactsHierarchy;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refresh: () => Promise<void>;
}

export interface UseLineItemsReturn {
  lineItems: LineItem[];
  addLineItem: (product: Product, quantity?: number) => void;
  updateLineItem: (productId: number, updates: Partial<LineItem>) => void;
  removeLineItem: (productId: number) => void;
  clearLineItems: () => void;
  totalValue: number;
  totalItems: number;
}

/**
 * Validation schemas
 */
export const ContactSchema = z.object({
  personId: z.number().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  orgId: z.number().positive().optional(),
  orgName: z.string().optional(),
  mineGroup: z.string().min(1),
  mineName: z.string().min(1),
  jobTitle: z.string().optional(),
});

export const LineItemSchema = z.object({
  pipedriveProductId: z.number().positive(),
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().positive(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  customDescription: z.string().optional(),
  showOnSalesHelper: z.boolean().optional(),
});

export const RequestFormDataSchema = z.object({
  salespersonFirstName: z.string().optional(),
  salespersonSelection: z.enum(['Luyanda', 'James', 'Stefan']).optional(),
  mineGroup: z.string().optional(),
  mineName: z.string().optional(),
  contact: ContactSchema.optional(),
  lineItems: z.array(LineItemSchema),
  comment: z.string().optional(),
});

/**
 * Utility types
 */
export type RequestCreateData = Omit<Request, 'id' | 'requestId' | 'createdAt' | 'updatedAt'>;
export type RequestUpdateData = Partial<Omit<Request, 'id' | 'requestId' | 'createdAt' | 'updatedAt'>>;
export type ContactCreateData = Omit<Contact, 'personId'>;
export type LineItemCreateData = Omit<LineItem, 'pipedriveProductId'>;

/**
 * Constants
 */
export const SALESPERSON_OPTIONS: SalespersonSelection[] = ['Luyanda', 'James', 'Stefan'];
export const REQUEST_STATUS_OPTIONS: RequestStatus[] = ['draft', 'submitted', 'failed'];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  failed: 'Failed',
};

export const SALESPERSON_LABELS: Record<SalespersonSelection, string> = {
  Luyanda: 'Luyanda',
  James: 'James',
  Stefan: 'Stefan',
};
