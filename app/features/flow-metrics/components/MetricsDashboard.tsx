/**
 * MetricsDashboard Component
 * 
 * Main dashboard layout for displaying flow metrics KPI cards
 */

'use client';

import React from 'react';
import { KPICard } from './KPICard';
import type { FlowMetricData } from '../types';

interface MetricsDashboardProps {
  metrics: FlowMetricData[];
  loading: boolean;
  selectedPeriod: string;
  onRefresh: () => void;
}

export function MetricsDashboard({
  metrics,
  loading,
  selectedPeriod,
  onRefresh,
}: MetricsDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 bg-gray-100 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium mb-2">No active metrics found</p>
          <p className="text-sm">
            Add metrics in the Mappings tab to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <KPICard
          key={metric.id}
          data={metric}
          selectedPeriod={selectedPeriod}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
