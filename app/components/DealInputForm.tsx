'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';

interface DealInputFormProps {
  onFetchSuccess: (data: any[], dealId?: number) => void;
  isLoading?: boolean;
}

export const DealInputForm: React.FC<DealInputFormProps> = ({ 
  onFetchSuccess, 
  isLoading = false 
}) => {
  const [dealId, setDealId] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  const handleFetch = async () => {
    if (!dealId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deal ID",
        variant: "destructive",
      });
      return;
    }

    setIsFetching(true);
    
    try {
      const response = await fetch('/api/pipedrive/deal-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deal_id: parseInt(dealId) }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Successfully fetched flow data for deal ${dealId}`,
        });
        onFetchSuccess(result.data || [], parseInt(dealId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch deal flow data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching deal flow:', error);
      toast({
        title: "Error",
        description: "Error, the requested deal could not be fetched",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex-1">
        <label htmlFor="deal-id" className="block text-sm font-medium text-gray-700 mb-1">
          Deal ID
        </label>
        <Input
          id="deal-id"
          type="number"
          placeholder="Enter Pipedrive deal ID"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isFetching || isLoading}
          className="w-full"
        />
      </div>
      <Button
        onClick={handleFetch}
        disabled={isFetching || isLoading || !dealId.trim()}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
      >
        {isFetching ? 'Fetching...' : 'Fetch'}
      </Button>
    </div>
  );
};
