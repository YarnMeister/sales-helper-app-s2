import React from 'react';
import { Button } from './ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  productName?: string; // For accessibility
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  size = 'md',
  disabled = false,
  productName = 'product'
}) => {
  const handleDecrease = () => {
    const newQuantity = Math.max(min, quantity - 1);
    onQuantityChange(newQuantity);
  };

  const handleIncrease = () => {
    const newQuantity = Math.min(max, quantity + 1);
    onQuantityChange(newQuantity);
  };

  const handleDirectInput = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onQuantityChange(numValue);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'h-8 w-8',
      text: 'text-sm',
      input: 'h-8 w-12 text-sm'
    },
    md: {
      button: 'h-10 w-10',
      text: 'text-base',
      input: 'h-10 w-16 text-base'
    },
    lg: {
      button: 'h-12 w-12',
      text: 'text-lg',
      input: 'h-12 w-20 text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div 
      className="flex items-center gap-2"
      data-testid={`sh-quantity-control-${productName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 active:bg-red-100`}
        aria-label={`Decrease quantity of ${productName} (currently ${quantity})`}
        data-testid="sh-quantity-decrease"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center">
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleDirectInput(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          className={`${classes.input} ${classes.text} border border-gray-300 rounded text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          aria-label={`Quantity of ${productName}`}
          data-testid="sh-quantity-input"
        />
        <span className="text-xs text-gray-500 mt-1">Qty</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className={`${classes.button} p-0 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 active:bg-green-100`}
        aria-label={`Increase quantity of ${productName} (currently ${quantity})`}
        data-testid="sh-quantity-increase"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
