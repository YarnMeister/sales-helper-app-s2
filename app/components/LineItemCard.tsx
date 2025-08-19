import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2, Minus, Plus } from 'lucide-react';
import { LineItem } from '../types/product';

interface LineItemCardProps {
  item: LineItem;
  index: number;
  isSubmitted: boolean;
  onQuantityChange?: (index: number, newQuantity: number) => void;
  onDelete?: (index: number) => void;
  className?: string;
}

export const LineItemCard: React.FC<LineItemCardProps> = ({
  item,
  index,
  isSubmitted,
  onQuantityChange,
  onDelete,
  className = ''
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && onQuantityChange) {
      onQuantityChange(index, newQuantity);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(index);
    }
  };

  return (
    <div className={`bg-white border border-green-200 rounded-lg p-4 ${className}`}>
      {/* Mobile Layout: 3 rows */}
      <div className="md:hidden">
        {/* Row 1: Product code and delete button */}
        <div className="flex items-center justify-between mb-2">
          {item.code && (
            <Badge variant="outline" className="text-xs font-medium">
              {item.code}
            </Badge>
          )}
          {!isSubmitted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
              data-testid={`sh-delete-line-item-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Row 2: Product description */}
        <div className="mb-3">
          <p className="text-sm text-gray-800 leading-relaxed">
            {item.name}
          </p>
          {item.shortDescription && (
            <p className="text-xs text-gray-600 mt-1">
              {item.shortDescription}
            </p>
          )}
        </div>
        
        {/* Row 3: Quantity controls and price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isSubmitted || item.quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isSubmitted}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {item.price && (
            <span className="text-sm font-bold text-green-600">
              R{(item.price * item.quantity).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Desktop Layout: Compact single row */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Product code */}
          {item.code && (
            <Badge variant="outline" className="text-xs font-medium">
              {item.code}
            </Badge>
          )}
          
          {/* Product description */}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {item.name}
            </p>
            {item.shortDescription && (
              <p className="text-xs text-gray-600 mt-1">
                {item.shortDescription}
              </p>
            )}
          </div>
        </div>
        
        {/* Quantity controls and price */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isSubmitted || item.quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isSubmitted}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {item.price && (
            <span className="text-sm font-bold text-green-600 min-w-[4rem] text-right">
              R{(item.price * item.quantity).toFixed(2)}
            </span>
          )}
          
          {/* Delete button */}
          {!isSubmitted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
              data-testid={`sh-delete-line-item-desktop-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
