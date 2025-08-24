import { getCachedProducts } from './redis-helper';
import { getCategoryMetadata } from './category-helper';
import { AccordionData, CategorySection, Product, ProductFilters } from './types';
import { logInfo, logWarn } from '@/lib/log';

/**
 * Shape product data for accordion view
 * Transforms cached Redis data into accordion-ready format
 */
export async function shapeProductsForAccordion(): Promise<AccordionData> {
  try {
    const cachedProducts = await getCachedProducts();
    const metadata = await getCategoryMetadata();

    if (!cachedProducts) {
      logWarn('BFF: No cached product data available for accordion shaping');
      return {
        categories: [],
        metadata: {
          categories: [],
          totalProducts: 0,
          lastUpdated: new Date().toISOString(),
          source: 'redis',
          error: 'No cached data available'
        }
      };
    }

    const categories: CategorySection[] = [];

    // Transform cached data into accordion sections
    Object.entries(cachedProducts).forEach(([categoryName, products]) => {
      categories.push({
        name: categoryName,
        products: products,
        productCount: products.length
      });
    });

    // Sort categories by product count (descending)
    categories.sort((a, b) => b.productCount - a.productCount);

    logInfo('BFF: Shaped product data for accordion view', {
      categoriesCount: categories.length,
      totalProducts: metadata.totalProducts
    });

    return {
      categories,
      metadata
    };
  } catch (error) {
    logWarn('BFF: Failed to shape products for accordion', { error: (error as Error).message });
    return {
      categories: [],
      metadata: {
        categories: [],
        totalProducts: 0,
        lastUpdated: new Date().toISOString(),
        source: 'redis',
        error: 'Failed to shape products for accordion'
      }
    };
  }
}

/**
 * Get product counts by category
 * Returns summary statistics for products
 */
export async function getProductCounts() {
  const metadata = await getCategoryMetadata();
  
  const productsByCategory: Record<string, number> = {};
  metadata.categories.forEach(category => {
    productsByCategory[category.name] = category.productCount;
  });

  return {
    totalProducts: metadata.totalProducts,
    productsByCategory,
    categoriesCount: metadata.categories.length
  };
}

/**
 * Filter products based on criteria
 * Returns filtered products that match the specified filters
 */
export async function getFilteredProducts(filters: ProductFilters): Promise<Product[]> {
  try {
    const cachedProducts = await getCachedProducts();
    
    if (!cachedProducts) {
      logWarn('BFF: No cached product data available for filtering');
      return [];
    }

    let allProducts: Product[] = [];
    
    // Flatten all products from all categories
    Object.values(cachedProducts).forEach(products => {
      allProducts = allProducts.concat(products);
    });

    // Apply filters
    let filteredProducts = allProducts;

    // Category filter
    if (filters.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category === filters.category
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.code && product.code.toLowerCase().includes(searchTerm))
      );
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        product.price >= filters.minPrice!
      );
    }

    if (filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        product.price <= filters.maxPrice!
      );
    }

    logInfo('BFF: Filtered products', {
      totalProducts: allProducts.length,
      filteredCount: filteredProducts.length,
      filtersApplied: Object.keys(filters).filter(key => filters[key as keyof ProductFilters] !== undefined)
    });

    return filteredProducts;
  } catch (error) {
    logWarn('BFF: Failed to filter products', { error: (error as Error).message });
    return [];
  }
}

/**
 * Get all products from all categories
 * Returns flattened array of all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const cachedProducts = await getCachedProducts();
    
    if (!cachedProducts) {
      logWarn('BFF: No cached product data available');
      return [];
    }

    const allProducts: Product[] = [];
    
    Object.values(cachedProducts).forEach(products => {
      allProducts.push(...products);
    });

    logInfo('BFF: Retrieved all products', { productCount: allProducts.length });
    return allProducts;
  } catch (error) {
    logWarn('BFF: Failed to get all products', { error: (error as Error).message });
    return [];
  }
}

/**
 * Search products by name or description
 * Returns products that match the search term
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  return getFilteredProducts({ searchTerm });
}

/**
 * Get products in a specific price range
 * Returns products within the specified price range
 */
export async function getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
  return getFilteredProducts({ minPrice, maxPrice });
}

/**
 * Transform raw Pipedrive products into categorized structure with dynamic category discovery
 * This replaces the hardcoded category mappings in lib/cache.ts
 */
export function transformRawProductsToCategorized(rawProducts: any[]): Record<string, any[]> {
  try {
    logInfo('BFF: Transforming raw products with dynamic category discovery', {
      productsCount: rawProducts.length
    });

    // Custom field IDs from legacy tech specs
    const SHORT_DESCRIPTION_FIELD_ID = 'f320da5e15bef8b83d8c9d997533107dfdb66d5c';
    const SHOW_ON_SALES_HELPER_FIELD_ID = '59af9d567fc57492de93e82653ce01d0c967f6f5';

    // Known category mappings for human-readable names
    const knownCategoryMap: Record<string, string> = {
      '28': 'Cable',
      '29': 'Conveyor Belt Equipment',
      '30': 'Environmental Monitoring',
      '31': 'General Supplies',
      '32': 'Services',
      '33': 'Panel Accessories',
      '34': 'Maintenance & Repair',
      '35': 'Rescue Bay Equipment',
      '36': 'Labour & Services',
      '37': 'Spare Parts',
      '80': 'New'
    };

    // Dynamic category mapping - auto-discover all categories
    const categoryMap: Record<string, string> = { ...knownCategoryMap };

    // Helper function to generate category name from ID for new categories
    const generateCategoryName = (categoryId: string): string => {
      return `Category ${categoryId}`;
    };

    // Track discovered categories for logging
    const discoveredCategories = new Set<string>();

    const result = rawProducts.reduce((acc, product) => {
      // Use known mapping or generate category name dynamically if not already mapped
      const categoryId = product.category as string;
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = generateCategoryName(categoryId);
        discoveredCategories.add(categoryId);
      }
      const category = categoryMap[categoryId];

      // Extract custom field values
      const shortDescription = product[SHORT_DESCRIPTION_FIELD_ID] || '';
      const showOnSalesHelperValue = product[SHOW_ON_SALES_HELPER_FIELD_ID];

      // Map "Show on Sales Helper" field: Custom dropdown field
      // Based on debug output, 78 = "Yes", 79 = "No" (dropdown option IDs)
      const showOnSalesHelper = showOnSalesHelperValue === 78 || showOnSalesHelperValue === '78';

      // Only include products that should be shown on Sales Helper
      if (!showOnSalesHelper) {
        return acc;
      }

      if (!acc[category]) acc[category] = [];

      // Extract price from the prices array (first price entry)
      const price = product.prices && product.prices.length > 0 ? product.prices[0].price : 0;

      acc[category].push({
        pipedriveProductId: product.id,
        name: product.name,
        code: product.code,
        price: price,
        description: product.description || '',
        shortDescription: shortDescription,
        showOnSalesHelper: showOnSalesHelper
      });

      return acc;
    }, {});

    // Log discovered categories
    if (discoveredCategories.size > 0) {
      logInfo('BFF: NEW CATEGORIES DISCOVERED', {
        categories: Array.from(discoveredCategories).map(id => `${id}: ${categoryMap[id]}`)
      });
    }

    logInfo('BFF: Raw products transformation completed', {
      inputProducts: rawProducts.length,
      outputCategories: Object.keys(result).length,
      totalProducts: Object.values(result).reduce((sum: number, products: any) => sum + (Array.isArray(products) ? products.length : 0), 0)
    });

    return result;
  } catch (error) {
    logWarn('BFF: Failed to transform raw products', { error: (error as Error).message });
    return {};
  }
}
