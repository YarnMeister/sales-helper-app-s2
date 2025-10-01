/**
 * FlowDataTable Component
 * 
 * Displays raw Pipedrive deal flow data in a table format
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FlowDataRow } from '../types';

interface FlowDataTableProps {
  data: FlowDataRow[];
  isLoading?: boolean;
  dealId?: number;
  onDataLoad?: (data: FlowDataRow[]) => void;
}

const INITIAL_ROW_LIMIT = 50;

export function FlowDataTable({
  data,
  isLoading = false,
  dealId,
  onDataLoad,
}: FlowDataTableProps) {
  const [showAllRows, setShowAllRows] = useState(false);

  // Limit rows for display
  const displayData = showAllRows ? data : data.slice(0, INITIAL_ROW_LIMIT);
  const hasMoreRows = data.length > INITIAL_ROW_LIMIT;

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


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Flow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Flow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No flow data available.</p>
            <p className="text-sm">Click &ldquo;Refresh Data&rdquo; above to sync data from Pipedrive.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Raw Flow Data
          {hasMoreRows && (
            <span className="text-sm font-normal text-gray-500">
              Showing {displayData.length} of {data.length} rows
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Stage Name</th>
                <th className="text-left p-2">Stage ID</th>
                <th className="text-left p-2">Deal ID</th>
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">Deal Title</th>
                <th className="text-left p-2">Deal Value</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{record.stageName}</td>
                  <td className="p-2">{record.stageId}</td>
                  <td className="p-2">{record.dealId}</td>
                  <td className="p-2">{formatDate(record.timestamp)}</td>
                  <td className="p-2">{record.dealTitle || '—'}</td>
                  <td className="p-2">{record.dealValue ? `${record.dealValue} ${record.dealCurrency || ''}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreRows && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAllRows(!showAllRows)}
              className="flex items-center gap-2"
            >
              {showAllRows ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less ({INITIAL_ROW_LIMIT} rows)
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show All ({data.length} rows)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
