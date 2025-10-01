/**
 * KPICard Component
 * 
 * Displays a flow metric as a KPI card with color coding, comments, and navigation
 * Includes defensive "no data" state handling
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { getMetricColor } from '../utils';
import type { FlowMetricData } from '../types';

interface KPICardProps {
  data: FlowMetricData;
  selectedPeriod: string;
  onRefresh: () => void;
}

export function KPICard({ data, selectedPeriod, onRefresh }: KPICardProps) {
  const router = useRouter();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [comment, setComment] = useState(data.metric_comment || '');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Extract numeric value from mainMetric (e.g., "5.2 days" -> 5.2)
  const numericValue = parseFloat(data.mainMetric.replace(' days', ''));
  const hasData = data.totalDeals > 0 && !isNaN(numericValue);

  const handleMoreInfo = () => {
    // Navigate to the detail page with the selected period
    router.push(`/flow-metrics-report/${data.id}?period=${selectedPeriod}`);
  };

  const handleSaveComment = async () => {
    try {
      setIsSavingComment(true);
      const response = await fetch(
        `/api/admin/flow-metrics-config/${data.id}/comment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        }
      );

      if (response.ok) {
        setIsEditingComment(false);
        // Refresh the metrics data to show the updated comment
        onRefresh();
      } else {
        console.error('Failed to save comment');
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCancelComment = () => {
    setComment(data.metric_comment || '');
    setIsEditingComment(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metric with Color Coding or No Data State */}
        {hasData ? (
          <>
            <div
              className={`text-3xl font-bold ${getMetricColor(
                numericValue,
                data.avg_min_days,
                data.avg_max_days
              )}`}
            >
              {data.mainMetric}
            </div>

            {/* Deal Count */}
            <div className="text-xs text-gray-500">
              Based on {data.totalDeals} {data.totalDeals === 1 ? 'deal' : 'deals'}
            </div>
          </>
        ) : (
          <>
            {/* No Data State */}
            <div className="text-3xl font-bold text-gray-400">—</div>
            <div className="text-sm text-yellow-600 flex items-center gap-1">
              <span>⚠️</span>
              <span>No data available</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Import deal flow data to see metrics
            </div>
          </>
        )}

        {/* More Info Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoreInfo}
          className="w-full mt-2 border-green-700 text-green-700 hover:bg-green-50"
          disabled={!hasData}
        >
          More info
        </Button>

        {/* Comment Section */}
        <div className="mt-4">
          {isEditingComment ? (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter narrative or interpretation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveComment}
                  disabled={isSavingComment}
                  className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSavingComment ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelComment}
                  disabled={isSavingComment}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {data.metric_comment ? (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {data.metric_comment}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingComment(true)}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingComment(true)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  + Add comment
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
