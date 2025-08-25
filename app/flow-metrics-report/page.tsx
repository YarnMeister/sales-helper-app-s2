'use client';

import React, { useState } from 'react';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/navigation';

// Mock data for the KPI cards
const mockMetricsData = [
  {
    id: 'lead-conversion',
    title: 'Lead Conversion Time',
    mainMetric: '8 days',
    best: '3d',
    worst: '12d',
    trend: 'up' as const,
  },
  {
    id: 'quote-conversion',
    title: 'Quote Conversion Time',
    mainMetric: '8 days',
    best: '8d',
    worst: '8d',
    trend: 'stable' as const,
  },
  {
    id: 'order-conversion',
    title: 'Order Conversion Time',
    mainMetric: '15 days',
    best: '5d',
    worst: '60d',
    trend: 'up' as const,
  },
  {
    id: 'procurement',
    title: 'Procurement Lead Time',
    mainMetric: '22 days',
    best: '10d',
    worst: '90d',
    trend: 'stable' as const,
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing Lead Time',
    mainMetric: '35 days',
    best: '20d',
    worst: '120d',
    trend: 'down' as const,
  },
  {
    id: 'delivery',
    title: 'Delivery Lead Time',
    mainMetric: '7 days',
    best: '2d',
    worst: '21d',
    trend: 'up' as const,
  },
];

// Trend icon component
const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  return (
    <span className={`text-sm font-medium ${getTrendColor()}`}>
      {getTrendIcon()}
    </span>
  );
};

// KPI Card component
const KPICard = ({ data }: { data: typeof mockMetricsData[0] }) => {
  const router = useRouter();
  
  const handleMoreInfo = () => {
    // Navigate to the detail page
    router.push(`/flow-metrics-report/${data.id}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metric */}
        <div className="text-3xl font-bold text-gray-900">
          {data.mainMetric}
        </div>
        
        {/* Best/Worst Metrics */}
        <div className="flex justify-between text-sm">
          <span className="text-green-600 font-medium">
            Best: {data.best}
          </span>
          <span className="text-red-600 font-medium">
            Worst: {data.worst}
          </span>
        </div>
        
        {/* Trend */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Trend</span>
          <TrendIcon trend={data.trend} />
        </div>
        
        {/* More Info Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoreInfo}
          className="w-full mt-2"
        >
          More info
        </Button>
      </CardContent>
    </Card>
  );
};

export default function FlowMetricsReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Flow Metrics Report" showDivider={false} />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lead Time Overview
              </h1>
              <p className="text-gray-600 mt-1">
                Track efficiency across your sales pipeline stages
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
                Period:
              </label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="7d">Last 7 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMetricsData.map((metric) => (
            <KPICard key={metric.id} data={metric} />
          ))}
        </div>
      </div>

      {/* Common Footer */}
      <CommonFooter 
        onNewRequest={() => {}} 
        isCreating={false}
      />
    </div>
  );
}
