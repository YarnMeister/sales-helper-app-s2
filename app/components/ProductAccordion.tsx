import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Package, AlertCircle } from 'lucide-react';
import { LineItem } from '../types/product';


interface ProductAccordionProps {
  onProductSelect: (product: LineItem) => void;
  existingItems?: LineItem[];
  className?: string;
  viewOnly?: boolean;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({
  onProductSelect,
  existingItems = [],
  className = '',
  viewOnly = false
}) => {
  const [products, setProducts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.ok) {
        setProducts(data.data);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError('Unable to load products. Please try refreshing.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Convert products object to categories array
  const categories = Object.entries(products).map(([categoryName, categoryProducts]) => ({
    name: categoryName,
    products: categoryProducts,
    productCount: categoryProducts.length
  }));

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

  const handleProductSelect = (product: any) => {
    const newLineItem: LineItem = {
      pipedriveProductId: product.pipedriveProductId,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: 1, // Default quantity
      description: product.description,
      shortDescription: product.shortDescription,
      showOnSalesHelper: product.showOnSalesHelper
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
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchProducts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className} w-full max-w-full overflow-x-hidden`} data-testid="sh-product-accordion">
      {/* Cache Source Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          📊 Data from Redis cache • {Object.values(products).flat().length} products • {categories.length} categories
        </p>
      </div>



      {/* Products Hierarchy */}
      <div className="space-y-3" data-testid="sh-products-hierarchy">
        {categories.sort((a, b) => a.name.localeCompare(b.name)).map((categorySection) => {
          const isCategoryExpanded = expandedCategories.has(categorySection.name);
          
          return (
            <Card key={categorySection.name} className="overflow-hidden shadow-sm">
              {/* Category Header */}
              <div
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors active:bg-gray-100"
                onClick={() => toggleCategory(categorySection.name)}
                data-testid={`sh-product-category-${categorySection.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCategoryExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900">{categorySection.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {categorySection.productCount} products
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Products List */}
              {isCategoryExpanded && (
                <div className="bg-white">
                  {categorySection.products.sort((a, b) => a.name.localeCompare(b.name)).map((product) => {
                    return (
                      <div
                        key={product.pipedriveProductId}
                        className={`p-4 border-b border-gray-50 last:border-b-0 transition-colors min-h-[44px] flex items-center ${
                          viewOnly 
                            ? 'cursor-default hover:bg-gray-25' 
                            : 'cursor-pointer hover:bg-gray-25 active:bg-gray-50'
                        }`}
                        onClick={() => !viewOnly && handleProductSelect(product)}
                        onKeyDown={(e) => {
                          if (!viewOnly && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleProductSelect(product);
                          }
                        }}
                        tabIndex={viewOnly ? -1 : 0}
                        role={viewOnly ? undefined : "button"}
                        aria-label={
                          viewOnly 
                            ? `View ${product.name}` 
                            : `Add ${product.name} to request`
                        }
                        data-testid={`sh-product-item-${product.pipedriveProductId}`}
                      >
                        <div className="flex items-start justify-between gap-4 w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              {product.code && (
                                <Badge variant="outline" className="text-xs">
                                  {product.code}
                                </Badge>
                              )}
                            </div>
                            
                            {product.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {product.description}
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
      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No products available.
          </p>
        </div>
      )}
    </div>
  );
};
