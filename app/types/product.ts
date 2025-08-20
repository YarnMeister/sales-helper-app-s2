export interface Product {
  pipedriveProductId: number;
  name: string;
  code?: string | null;
  price?: number;
  description?: string;
  shortDescription?: string;
  showOnSalesHelper?: boolean;
}

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

export interface ProductsHierarchy {
  [category: string]: Product[];
}

export interface ProductsApiResponse {
  ok: boolean;
  data: ProductsHierarchy;
  stale?: boolean;
  source?: 'cache' | 'pipedrive' | 'cache_fallback';
  message?: string;
}

export interface ProductSelectionState {
  expandedCategories: Set<string>;
  selectedProducts: Map<number, LineItem>; // productId -> LineItem
  searchTerm: string;
}

export interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}
