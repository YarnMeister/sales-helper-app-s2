'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

interface CacheRefreshButtonProps {
  className?: string;
}

export const CacheRefreshButton: React.FC<CacheRefreshButtonProps> = ({ 
  className = '' 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: "Cache Refreshed",
          description: "Data has been refreshed from Pipedrive. New contacts and products should now be visible.",
          duration: 3000,
        });
      } else {
        throw new Error(data.error || 'Failed to refresh cache');
      }
    } catch (error) {
      console.error('Cache refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`p-2 h-auto ${className}`}
      title="Refresh data from Pipedrive"
      data-testid="cache-refresh-button"
    >
      <RefreshCw 
        className={`h-4 w-4 text-gray-500 hover:text-gray-700 transition-colors ${
          isRefreshing ? 'animate-spin' : ''
        }`} 
      />
    </Button>
  );
};
