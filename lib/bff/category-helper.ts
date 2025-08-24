import { getCachedProducts } from './redis-helper';
import { CategoryInfo, CategoryMetadata, Product, CategorySection } from './types';
import { logInfo, logWarn } from '@/lib/log';

/**
 * Extract category metadata from cached product data
 * Returns information about all categories including product counts
 */
export async function getCategoryMetadata(): Promise<CategoryMetadata> {
  try {
    const cachedProducts = await getCachedProducts();
    
    if (!cachedProducts) {
      logWarn('BFF: No cached product data available for category metadata');
      return {
        categories: [],
        totalProducts: 0,
        lastUpdated: new Date().toISOString(),
        source: 'redis',
        error: 'No cached data available'
      };
    }

    const categories: CategoryInfo[] = [];
    let totalProducts = 0;

    // Extract category information from cached data
    Object.entries(cachedProducts).forEach(([categoryName, products]) => {
      const productCount = products.length;
      totalProducts += productCount;
      
      categories.push({
        name: categoryName,
        productCount,
        lastUpdated: new Date().toISOString()
      });
    });

    // Sort categories by product count (descending)
    categories.sort((a, b) => b.productCount - a.productCount);

    logInfo('BFF: Extracted category metadata from Redis cache', {
      categoriesCount: categories.length,
      totalProducts
    });

    return {
      categories,
      totalProducts,
      lastUpdated: new Date().toISOString(),
      source: 'redis'
    };
  } catch (error) {
    logWarn('BFF: Failed to extract category metadata', { error: (error as Error).message });
    return {
      categories: [],
      totalProducts: 0,
      lastUpdated: new Date().toISOString(),
      source: 'redis',
      error: 'Failed to extract category metadata'
    };
  }
}

/**
 * Get list of all categories with basic information
 * Returns simplified category information for UI components
 */
export async function getCategoryList(): Promise<CategoryInfo[]> {
  const metadata = await getCategoryMetadata();
  return metadata.categories;
}

/**
 * Get products for a specific category
 * Returns all products in the specified category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const cachedProducts = await getCachedProducts();
    
    if (!cachedProducts) {
      logWarn('BFF: No cached product data available for category lookup', { category });
      return [];
    }

    const products = cachedProducts[category] || [];
    
    logInfo('BFF: Retrieved products for category', { 
      category, 
      productCount: products.length 
    });

    return products;
  } catch (error) {
    logWarn('BFF: Failed to get products for category', { 
      category, 
      error: (error as Error).message 
    });
    return [];
  }
}

/**
 * Get category statistics
 * Returns summary information about categories and products
 */
export async function getCategoryStats() {
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
 * Check if a specific category exists
 * Returns true if the category has products in the cache
 */
export async function categoryExists(category: string): Promise<boolean> {
  const cachedProducts = await getCachedProducts();
  return cachedProducts ? category in cachedProducts : false;
}

/**
 * Get all unique category names
 * Returns array of category names from cached data
 */
export async function getAllCategoryNames(): Promise<string[]> {
  const cachedProducts = await getCachedProducts();
  return cachedProducts ? Object.keys(cachedProducts) : [];
}
