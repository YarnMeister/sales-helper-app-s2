import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Search, Package, Check, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, LineItem, ProductsHierarchy } from '../types/product';
import { QuantityControl } from './QuantityControl';
import { useDebounce } from '../hooks/useDebounce';

interface ProductAccordionProps {
  onProductsChange: (products: LineItem[]) => void;
  selectedProducts: LineItem[];
  className?: string;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({
  onProductsChange,
  selectedProducts,
  className = ''
}) => {
  const [productsData, setProductsData] = useState<ProductsHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Convert selectedProducts array to Map for easier lookup
  const selectedProductsMap = useMemo(() => {
    return new Map(selectedProducts.map(item => [item.pipedriveProductId, item]));
  }, [selectedProducts]);

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

  const handleProductAdd = (product: Product) => {
    const newLineItem: LineItem = {
      pipedriveProductId: product.pipedriveProductId,
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: 1, // Default quantity
      shortDescription: product.shortDescription
    };

    const updatedProducts = [...selectedProducts, newLineItem];
    onProductsChange(updatedProducts);
  };

  const handleProductRemove = (productId: number) => {
    const updatedProducts = selectedProducts.filter(item => item.pipedriveProductId !== productId);
    onProductsChange(updatedProducts);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const updatedProducts = selectedProducts.map(item =>
      item.pipedriveProductId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    onProductsChange(updatedProducts);
  };

  const getTotalItems = () => selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalValue = () => selectedProducts.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

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

      {/* Selection Summary */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">
              Selected Products ({selectedProducts.length})
            </h3>
          </div>
          <div className="space-y-1 text-sm text-green-800">
            <p>Total Items: {getTotalItems()}</p>
            {getTotalValue() > 0 && (
              <p>Total Value: R{getTotalValue().toFixed(2)}</p>
            )}
          </div>
        </div>
      )}

      {/* Products Hierarchy */}
      <div className="space-y-3" data-testid="sh-products-hierarchy">
        {Object.entries(filteredProductsData).map(([category, products]) => {
          const isCategoryExpanded = expandedCategories.has(category);
          const selectedInCategory = products.filter(p => selectedProductsMap.has(p.pipedriveProductId)).length;
          
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
                    {selectedInCategory > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        {selectedInCategory} selected
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
                    const isSelected = selectedProductsMap.has(product.pipedriveProductId);
                    const selectedItem = selectedProductsMap.get(product.pipedriveProductId);
                    
                    return (
                      <div
                        key={product.pipedriveProductId}
                        className={`p-4 border-b border-gray-50 last:border-b-0 transition-colors ${
                          isSelected ? 'bg-green-25' : 'hover:bg-gray-25'
                        }`}
                        data-testid={`sh-product-item-${product.pipedriveProductId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-green-600" />
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
                          
                          <div className="flex flex-col items-end gap-2">
                            {isSelected ? (
                              <div className="space-y-2">
                                <QuantityControl
                                  quantity={selectedItem?.quantity || 1}
                                  onQuantityChange={(qty) => handleQuantityChange(product.pipedriveProductId, qty)}
                                  productName={product.name}
                                  size="sm"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProductRemove(product.pipedriveProductId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={`sh-remove-product-${product.pipedriveProductId}`}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleProductAdd(product)}
                                className="bg-blue-600 hover:bg-blue-700"
                                data-testid={`sh-add-product-${product.pipedriveProductId}`}
                              >
                                Add
                              </Button>
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
