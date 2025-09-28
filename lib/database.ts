// Re-export comprehensive database types
export * from '../types/shared/database';

// Legacy types for backward compatibility (can be removed later)
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  contact_id: string;
  check_in_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
