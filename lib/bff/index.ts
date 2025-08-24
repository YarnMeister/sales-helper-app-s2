// BFF (Backend for Frontend) Helper Functions
// Central export point for all BFF functionality

// Types
export * from './types';

// Redis Helper Functions
export {
  getCachedProducts,
  getCachedContacts,
  isCacheStale,
  getCacheStatus
} from './redis-helper';

// Category Helper Functions
export {
  getCategoryMetadata,
  getCategoryList,
  getProductsByCategory,
  getCategoryStats,
  categoryExists,
  getAllCategoryNames
} from './category-helper';

// Product Shape Helper Functions
export {
  shapeProductsForAccordion,
  getProductCounts,
  getFilteredProducts,
  getAllProducts,
  searchProducts,
  getProductsByPriceRange,
  transformRawProductsToCategorized
} from './product-shape';
