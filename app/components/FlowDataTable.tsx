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
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
                <th className="text-left py-2 px-2 font-medium text-gray-700">Stage</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Entered At</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Left At</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Duration</th>
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
                  <td className="py-2 px-2 text-gray-700">
                    {record.stage_name}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {formatDate(record.entered_at)}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {record.left_at ? formatDate(record.left_at) : '-'}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {formatDuration(record.duration_seconds)}
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
