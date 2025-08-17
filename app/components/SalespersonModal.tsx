import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X } from 'lucide-react';

interface SalespersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (salesperson: string) => void;
}

export const SalespersonModal: React.FC<SalespersonModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  const handleSelect = (salesperson: string) => {
    onSelect(salesperson);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Who&apos;s requesting?</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Salesperson Options */}
          <div className="space-y-3">
            {['James', 'Luyanda', 'Stefan'].map((name) => (
              <Button
                key={name}
                variant="outline"
                className="w-full h-12 text-lg font-medium hover:bg-red-50 hover:border-red-300"
                onClick={() => handleSelect(name)}
              >
                {name}
              </Button>
            ))}
          </div>

          {/* Cancel Button */}
          <div className="mt-6">
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
