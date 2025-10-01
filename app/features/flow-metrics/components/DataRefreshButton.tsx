/**
 * DataRefreshButton Component
 * 
 * Triggers manual sync of Pipedrive deal flow data
 * Shows real-time sync progress and status
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DataRefreshButtonProps {
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onDataUpdate?: () => void;
}

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  hoursSinceLastSync: number | null;
}

export function DataRefreshButton({
  onSyncStart,
  onSyncComplete,
  onDataUpdate,
}: DataRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch current sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/trigger-sync');
      const result = await response.json();

      if (result.success && result.data) {
        setSyncStatus(result.data.currentStatus);
        return result.data.currentStatus;
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
    return null;
  }, []);

  // Poll for sync status while running
  useEffect(() => {
    if (isRefreshing) {
      const interval = setInterval(async () => {
        const status = await fetchSyncStatus();
        
        // If sync is no longer running, stop polling
        if (status && !status.isRunning) {
          setIsRefreshing(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          toast({
            title: 'Sync Complete',
            description: 'Data refresh completed successfully',
          });
          
          onSyncComplete?.();
          onDataUpdate?.();
        }
      }, 3000); // Poll every 3 seconds

      setPollingInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isRefreshing, fetchSyncStatus, toast, onSyncComplete, onDataUpdate, pollingInterval]);

  // Initial status fetch
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleRefresh = async () => {
    // Check if sync is already running
    const currentStatus = await fetchSyncStatus();
    if (currentStatus?.isRunning) {
      toast({
        title: 'Sync Already Running',
        description: 'A sync operation is already in progress. Please wait for it to complete.',
        variant: 'destructive',
      });
      return;
    }

    setIsRefreshing(true);
    onSyncStart?.();

    try {
      const response = await fetch('/api/admin/trigger-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'incremental',
          daysBack: 7,
          batchSize: 20,
          async: true, // Run in background
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Sync Started',
          description: result.message || 'Data refresh started in background',
        });
        
        // Start polling for updates
        onDataUpdate?.();
      } else {
        setIsRefreshing(false);
        toast({
          title: 'Error',
          description: result.error || 'Failed to start data refresh',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setIsRefreshing(false);
      console.error('Error triggering sync:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger data refresh',
        variant: 'destructive',
      });
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing || syncStatus?.isRunning}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
      >
        {isRefreshing || syncStatus?.isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </>
        )}
      </Button>

      {syncStatus && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {syncStatus.isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Sync in progress...</span>
            </>
          ) : syncStatus.lastSync ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Last synced: {formatLastSync(syncStatus.lastSync)}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>No previous sync</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

