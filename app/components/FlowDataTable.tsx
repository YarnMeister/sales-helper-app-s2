'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface FlowDataRecord {
  id: string;
  deal_id: number;
  pipeline_id: number;
  stage_id: number;
  stage_name: string;
  entered_at: string;
  left_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FlowDataTableProps {
  data: FlowDataRecord[];
  isLoading?: boolean;
  dealId?: number;
  onDataLoad?: (data: FlowDataRecord[], pagination?: PaginationInfo) => void;
}

export const FlowDataTable: React.FC<FlowDataTableProps> = ({ 
  data, 
  isLoading = false, 
  dealId,
  onDataLoad 
}) => {
  const [currentData, setCurrentData] = useState<FlowDataRecord[]>(data);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usePagination, setUsePagination] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '-';
    }
  };

  // Load initial data with pagination if we have a dealId
  useEffect(() => {
    if (dealId && data.length === 0) {
      setUsePagination(true);
      loadPaginatedData(1);
    } else {
      setCurrentData(data);
      setUsePagination(false);
    }
  }, [dealId, data, loadPaginatedData]);

  const loadPaginatedData = useCallback(async (page: number) => {
    if (!dealId) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/pipedrive/deal-flow-data?deal_id=${dealId}&page=${page}&limit=50&paginated=true`
      );
      const result = await response.json();

      if (result.success) {
        setCurrentData(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
        onDataLoad?.(result.data, result.pagination);
      } else {
        console.error('Failed to load paginated data:', result.error);
      }
    } catch (error) {
      console.error('Error loading paginated data:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [dealId, onDataLoad]);

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      loadPaginatedData(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage) {
      loadPaginatedData(currentPage - 1);
    }
  };

  const handleLoadAll = async () => {
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/pipedrive/deal-flow-data?deal_id=${dealId}&paginated=false`
      );
      const result = await response.json();

      if (result.success) {
        setCurrentData(result.data);
        setPagination(null);
        setUsePagination(false);
        onDataLoad?.(result.data);
      } else {
        console.error('Failed to load all data:', result.error);
      }
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Flow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500 mr-2" />
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Flow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">No flow data available. Fetch a deal to see data here.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCount = usePagination ? currentData.length : currentData.length;
  const totalCount = pagination?.totalCount || currentData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Flow Data</CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {usePagination ? (
              <>
                Showing {displayCount} of {totalCount} stage transitions
                {pagination && (
                  <span className="ml-2 text-gray-500">
                    (Page {pagination.page} of {pagination.totalPages})
                  </span>
                )}
              </>
            ) : (
              `Showing ${displayCount} stage transitions`
            )}
          </p>
          {dealId && usePagination && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadAll}
              disabled={isLoadingMore}
              className="text-xs"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Load All Data
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-700">Deal ID</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Stage ID</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Stage</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Entered At</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((record, index) => (
                <tr 
                  key={record.id || index} 
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 px-2 text-gray-900 font-medium">
                    {record.deal_id}
                  </td>
                  <td className="py-2 px-2 text-gray-700 font-mono text-sm">
                    {record.stage_id}
                  </td>
                  <td className="py-2 px-2 text-gray-700">
                    {record.stage_name}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {formatDate(record.entered_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {usePagination && pagination && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination.hasPrevPage || isLoadingMore}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage || isLoadingMore}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading indicator for pagination */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Loading more data...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
