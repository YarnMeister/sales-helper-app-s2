import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Search, Package, AlertCircle } from 'lucide-react';
import { Product, LineItem, ProductsHierarchy } from '../types/product';
import { useDebounce } from '../hooks/useDebounce';

interface ProductAccordionProps {
  onProductSelect: (product: LineItem) => void;
  existingItems: LineItem[];
  className?: string;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({
  onProductSelect,
  existingItems,
  className = ''
}) => {
  const [productsData, setProductsData] = useState<ProductsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Convert existingItems array to Map for easier lookup
  const existingItemsMap = useMemo(() => {
    return new Map(existingItems.map(item => [item.pipedriveProductId, item]));
  }, [existingItems]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.ok) {
        setProductsData(data.data);
        setStale(data.stale || false);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Unable to load products. Please check your connection.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProductsData = useMemo(() => {
    if (!debouncedSearchTerm) return productsData;

    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return Object.entries(productsData).reduce((acc, [category, products]) => {
      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.shortDescription?.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower)
      );
      
      if (filteredProducts.length > 0) {
        acc[category] = filteredProducts;
      }
      return acc;
    }, {} as ProductsHierarchy);
  }, [productsData, debouncedSearchTerm]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return newExpanded;
    });
  };

  const handleProductSelect = (product: Product) => {
    const newLineItem: LineItem = {
      pipedriveProductId: product.pipedriveProductId,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: 1, // Default quantity
      shortDescription: product.shortDescription
    };

    onProductSelect(newLineItem);
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-products-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="sh-products-error">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchProducts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className} data-testid="sh-product-accordion">
      {/* Stale Data Warning */}
      {stale && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Using offline data. Some products may be outdated.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products, categories, or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base"
            data-testid="sh-product-search"
          />
        </div>
      </div>

      {/* Products Hierarchy */}
      <div className="space-y-3" data-testid="sh-products-hierarchy">
        {Object.entries(filteredProductsData).map(([category, products]) => {
          const isCategoryExpanded = expandedCategories.has(category);
          const existingInCategory = products.filter(p => existingItemsMap.has(p.pipedriveProductId)).length;
          
          return (
            <Card key={category} className="overflow-hidden shadow-sm">
              {/* Category Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
                onClick={() => toggleCategory(category)}
                data-testid={`sh-product-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCategoryExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900">{category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {existingInCategory > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        {existingInCategory} added
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {products.length} products
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Products List */}
              {isCategoryExpanded && (
                <div className="bg-white">
                  {products.map((product) => {
                    const isExisting = existingItemsMap.has(product.pipedriveProductId);
                    
                    return (
                      <div
                        key={product.pipedriveProductId}
                        className={`p-4 border-b border-gray-50 last:border-b-0 transition-colors cursor-pointer min-h-[44px] flex items-center ${
                          isExisting ? 'bg-green-25' : 'hover:bg-gray-25 active:bg-gray-50'
                        }`}
                        onClick={() => !isExisting && handleProductSelect(product)}
                        onKeyDown={(e) => {
                          if (!isExisting && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleProductSelect(product);
                          }
                        }}
                        tabIndex={isExisting ? -1 : 0}
                        role={isExisting ? undefined : "button"}
                        aria-label={isExisting ? `${product.name} already added` : `Add ${product.name} to request`}
                        data-testid={`sh-product-item-${product.pipedriveProductId}`}
                      >
                        <div className="flex items-start justify-between gap-4 w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              {isExisting && (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  Added
                                </Badge>
                              )}
                              {product.code && (
                                <Badge variant="outline" className="text-xs">
                                  {product.code}
                                </Badge>
                              )}
                            </div>
                            
                            {product.shortDescription && (
                              <p className="text-sm text-gray-600 mb-2">
                                {product.shortDescription}
                              </p>
                            )}
                            
                            {product.price && (
                              <p className="text-sm font-medium text-green-600">
                                R{product.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {Object.keys(filteredProductsData).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {debouncedSearchTerm ? 'No products found matching your search.' : 'No products available.'}
          </p>
          {debouncedSearchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
