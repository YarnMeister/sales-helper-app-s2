'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

interface FlowDataTableProps {
  data: FlowDataRecord[];
  isLoading?: boolean;
}

export const FlowDataTable: React.FC<FlowDataTableProps> = ({ data, isLoading = false }) => {
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
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Flow Data</CardTitle>
        <p className="text-sm text-gray-600">
          Showing {data.length} stage transitions
        </p>
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
              {data.map((record, index) => (
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
      </CardContent>
    </Card>
  );
};
