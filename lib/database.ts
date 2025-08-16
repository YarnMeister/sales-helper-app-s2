// Database schema types
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  contact_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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

// Database table names
export const TABLES = {
  CONTACTS: 'contacts',
  LINE_ITEMS: 'line_items',
  CHECK_INS: 'check_ins',
} as const;
