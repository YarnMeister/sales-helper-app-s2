// Database schema types matching the Neon PostgreSQL migrations

export type RequestStatus = 'draft' | 'submitted' | 'failed';

export type SalespersonSelection = 'Luyanda' | 'James' | 'Stefan';

// Contact JSONB structure
export interface ContactJSON {
  personId: number;
  orgId?: number;
  name: string;
  email?: string;
  phone?: string;
  mineGroup: string;  // Required for mobile-first workflow
  mineName: string;   // Required for mobile-first workflow
  company?: string;
  title?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
}

// Line Item JSONB structure
export interface LineItem {
  pipedriveProductId: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency?: string;
  category?: string;
  customFields?: Record<string, any>;
  shortDescription?: string;
  showOnSalesHelper?: boolean;
}

// Main Request table structure
export interface Request {
  id: string;
  request_id: string;  // QR-001 format
  status: RequestStatus;
  salesperson_first_name?: string;
  salesperson_selection?: SalespersonSelection;
  mine_group?: string;
  mine_name?: string;
  contact: ContactJSON | null;
  line_items: LineItem[];
  comment?: string;
  pipedrive_deal_id?: number;
  created_at: string;
  updated_at: string;
  
  // Generated columns for fast filtering
  contact_person_id_int?: number;
  contact_org_id_int?: number;
  contact_mine_group?: string;
  contact_mine_name?: string;
}

// KV Cache table structure
export interface KVCache {
  key: string;
  value: any;
  updated_at: string;
}

// Mock submissions table structure
export interface MockPipedriveSubmission {
  id: number;
  request_id: string;
  payload: any;
  simulated_deal_id: number;
  status: string;
  created_at: string;
}

// Database table names
export const TABLES = {
  REQUESTS: 'requests',
  KV_CACHE: 'kv_cache',
  MOCK_PIPEDRIVE_SUBMISSIONS: 'mock_pipedrive_submissions',
} as const;

// Validation schemas using Zod
import { z } from 'zod';

export const ContactJSONSchema = z.object({
  personId: z.number().positive(),
  orgId: z.number().positive().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mineGroup: z.string().min(1),  // Required
  mineName: z.string().min(1),   // Required
  company: z.string().optional(),
  title: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  customFields: z.record(z.any()).optional(),
});

export const LineItemSchema = z.object({
  pipedriveProductId: z.number().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  currency: z.string().optional(),
  category: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  shortDescription: z.string().optional(),
  showOnSalesHelper: z.boolean().optional(),
});

export const RequestSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().regex(/^QR-\d{3}$/),
  status: z.enum(['draft', 'submitted', 'failed']),
  salesperson_first_name: z.string().optional(),
  salesperson_selection: z.enum(['Luyanda', 'James', 'Stefan']).optional(),
  mine_group: z.string().optional(),
  mine_name: z.string().optional(),
  contact: ContactJSONSchema.nullable(),
  line_items: z.array(LineItemSchema),
  comment: z.string().optional(),
  pipedrive_deal_id: z.number().positive().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  contact_person_id_int: z.number().optional(),
  contact_org_id_int: z.number().optional(),
  contact_mine_group: z.string().optional(),
  contact_mine_name: z.string().optional(),
});

// Helper types for database operations
export type RequestInsert = Omit<Request, 'id' | 'created_at' | 'updated_at' | 'contact_person_id_int' | 'contact_org_id_int' | 'contact_mine_group' | 'contact_mine_name'>;
export type RequestUpdate = Partial<Omit<Request, 'id' | 'created_at' | 'updated_at' | 'contact_person_id_int' | 'contact_org_id_int' | 'contact_mine_group' | 'contact_mine_name'>>;

// Validation functions
export const validateContact = (contact: any): contact is ContactJSON => {
  return ContactJSONSchema.safeParse(contact).success;
};

export const validateLineItem = (lineItem: any): lineItem is LineItem => {
  return LineItemSchema.safeParse(lineItem).success;
};

export const validateRequest = (request: any): request is Request => {
  return RequestSchema.safeParse(request).success;
};

// Helper functions for request validation
export const isRequestSubmittable = (request: Request): boolean => {
  return (
    request.status === 'draft' &&
    request.contact !== null &&
    validateContact(request.contact) &&
    request.line_items.length > 0 &&
    request.line_items.every(validateLineItem)
  );
};

export const getMissingRequirements = (request: Request): string[] => {
  const missing: string[] = [];
  
  if (!request.contact) {
    missing.push('contact');
  } else if (!validateContact(request.contact)) {
    missing.push('valid contact information');
  }
  
  if (request.line_items.length === 0) {
    missing.push('line items');
  } else if (!request.line_items.every(validateLineItem)) {
    missing.push('valid line items');
  }
  
  return missing;
};
