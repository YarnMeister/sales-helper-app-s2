// BFF (Backend for Frontend) Type Definitions
// These types define the data structures used by BFF helper functions

export interface CategoryInfo {
  name: string;
  productCount: number;
  lastUpdated: string;
}

export interface CategoryMetadata {
  categories: CategoryInfo[];
  totalProducts: number;
  lastUpdated: string;
  source: 'redis';
  error?: string;
}

export interface Product {
  pipedriveProductId: number;
  name: string;
  code?: string;
  price: number;
  description: string;
  shortDescription: string;
  showOnSalesHelper: boolean;
  category: string;
  originalCategoryId?: string | number;
}

export interface CategorySection {
  name: string;
  products: Product[];
  productCount: number;
}

export interface AccordionData {
  categories: CategorySection[];
  metadata: CategoryMetadata;
}

export interface ProductCounts {
  totalProducts: number;
  productsByCategory: Record<string, number>;
  categoriesCount: number;
}

export interface CachedProductData {
  [category: string]: Product[];
}

export interface CachedContactData {
  [mineGroup: string]: {
    [mineName: string]: Array<{
      personId: number;
      name: string;
      email: string | null;
      phone: string | null;
      orgId?: number;
      orgName?: string;
      mineGroup: string;
      mineName: string;
      jobTitle?: string | null;
    }>;
  };
}

export interface ProductFilters {
  category?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
}
