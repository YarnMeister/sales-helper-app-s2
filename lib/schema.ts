import { z } from "zod";

// Salesperson enum matching database constraint and PRD requirements
export const SalespersonSelection = z.enum(['Luyanda', 'James', 'Stefan'], {
  errorMap: () => ({ message: "Salesperson must be one of: Luyanda, James, Stefan" })
});

// Line item schema with validation
export const LineItem = z.object({
  pipedriveProductId: z.number().int().positive("Product ID must be a positive integer"),
  name: z.string().min(1, "Product name is required"),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative("Price cannot be negative").default(0),
  quantity: z.number().int().positive("Quantity must be a positive integer").default(1),
  shortDescription: z.string().optional(),
  customDescription: z.string().optional(),
}).refine(
  (data) => data.name.trim().length > 0,
  { message: "Product name cannot be empty or whitespace only", path: ["name"] }
);

// Contact information schema with mobile-first PRD requirements
export const ContactJSON = z.object({
  personId: z.number().int().positive("Person ID must be a positive integer"),
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  orgId: z.number().int().positive("Organization ID must be a positive integer").optional(),
  orgName: z.string().optional(),
  mineGroup: z.string().min(1, "Mine group is required for mobile-first workflow"),
  mineName: z.string().min(1, "Mine name is required for mobile-first workflow"),
}).refine(
  (data) => data.name.trim().length > 0,
  { message: "Contact name cannot be empty or whitespace only", path: ["name"] }
).refine(
  (data) => data.mineGroup && data.mineGroup.trim().length > 0,
  { message: "Mine group is required and cannot be empty", path: ["mineGroup"] }
).refine(
  (data) => data.mineName && data.mineName.trim().length > 0,
  { message: "Mine name is required and cannot be empty", path: ["mineName"] }
);

// Request upsert schema for API operations with mobile-first validations
export const RequestUpsert = z.object({
  id: z.string().uuid("Invalid UUID format").optional(),
  salespersonFirstName: z.string().min(1, "Salesperson first name is required").optional(),
  salespersonSelection: SalespersonSelection.optional(),
  mineGroup: z.string().optional(),
  mineName: z.string().optional(),
  contact: ContactJSON.nullable().optional(),
  line_items: z.array(LineItem).default([]),
  comment: z.string().max(2000, "Comment cannot exceed 2000 characters").optional(),
}).refine(
  (data) => {
    if (data.salespersonFirstName && data.salespersonFirstName.trim().length === 0) {
      return false;
    }
    return true;
  },
  { message: "Salesperson name cannot be empty or whitespace only", path: ["salespersonFirstName"] }
).refine(
  (data) => {
    // For mobile-first workflow, require either salespersonSelection or salespersonFirstName
    // ONLY when creating new requests (no id provided)
    if (!data.id) {
      return data.salespersonSelection || data.salespersonFirstName;
    }
    return true;
  },
  { message: "Either salesperson selection or salesperson first name is required", path: ["salespersonSelection"] }
);

// Database record schema for type safety
export const RequestRecord = z.object({
  id: z.string().uuid(),
  request_id: z.string().regex(/^QR-\d{3}$/, "Invalid request ID format"),
  status: z.enum(['draft', 'submitted', 'failed']),
  salesperson_first_name: z.string().nullable(),
  salesperson_selection: SalespersonSelection.nullable(),
  mine_group: z.string().nullable(),
  mine_name: z.string().nullable(),
  contact: ContactJSON.nullable(),
  line_items: z.array(LineItem),
  comment: z.string().nullable(),
  pipedrive_deal_id: z.number().int().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Export types
export type TSalespersonSelection = z.infer<typeof SalespersonSelection>;
export type TLineItem = z.infer<typeof LineItem>;
export type TContactJSON = z.infer<typeof ContactJSON>;
export type TRequestUpsert = z.infer<typeof RequestUpsert>;
export type TRequestRecord = z.infer<typeof RequestRecord>;
