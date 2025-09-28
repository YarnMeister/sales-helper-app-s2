/**
 * Product types for the application
 * Consolidated to avoid module resolution issues
 */

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
 * Products hierarchy for UI display
 */
export interface ProductsHierarchy {
  [category: string]: Product[];
}

/**
 * Product selection state for UI components
 */
export interface ProductSelectionState {
  expandedCategories: Set<string>;
  searchTerm: string;
}

/**
 * API Response types
 */
export interface ProductsApiResponse {
  ok: boolean;
  data: ProductsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

/**
 * Component Props types
 */
export interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}
