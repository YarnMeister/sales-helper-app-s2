/**
 * Flow Metric Detail Page
 * 
 * Detailed view of a specific flow metric with deal data and charts
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommonHeader } from '../../../../components/CommonHeader';
import { CommonFooter } from '../../../../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import LeadTimeChart from '../../../../components/LeadTimeChart';
import { useMetricDetail } from '../../hooks';
import { calculateMetrics, TIME_PERIODS, DEFAULT_PERIOD } from '../../utils';

interface PageProps {
  params: {
    'metric-id': string;
  };
}

export default function FlowMetricDetailPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const metricId = params['metric-id'];

  // Get period from URL query parameter, default to '7d'
  const urlPeriod = searchParams.get('period') || DEFAULT_PERIOD;
  const [selectedPeriod, setSelectedPeriod] = useState(urlPeriod);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart');

  // Use custom hook for data fetching
  const { deals, config, loading: isLoading, error } = useMetricDetail(metricId, selectedPeriod);

  // Calculate metrics from the deals data
  const calculatedMetrics = useMemo(() => calculateMetrics(deals), [deals]);

  // Sync state with URL changes
  useEffect(() => {
    const currentUrlPeriod = searchParams.get('period') || DEFAULT_PERIOD;
    if (currentUrlPeriod !== selectedPeriod) {
      setSelectedPeriod(currentUrlPeriod);
    }
  }, [searchParams, selectedPeriod]);

  // Update URL when period changes
  const handlePeriodChange = (period: string) => {
    const newUrl = `/flow-metrics-report/${metricId}?period=${period}`;
    router.replace(newUrl, { scroll: false });
    setSelectedPeriod(period);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Flow Metric Detail" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500">Loading metric details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Flow Metric Detail" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error loading metric:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
        <CommonHeader title="Flow Metric Detail" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button and Title */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/flow-metrics-report')}
            className="mb-4"
          >
            ← Back to Flow Metrics
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {config?.display_title || 'Flow Metric Detail'}
          </h1>
        </div>

        {/* Period Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  onClick={() => handlePeriodChange(period.value)}
                  size="sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculatedMetrics.totalDeals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedMetrics.average.toFixed(1)} days
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Min Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedMetrics.best.toFixed(1)} days
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Max Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculatedMetrics.worst.toFixed(1)} days
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            onClick={() => setViewMode('chart')}
          >
            Chart View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
        </div>

        {/* Data Visualization */}
        {calculatedMetrics.totalDeals > 0 ? (
          viewMode === 'chart' ? (
            <LeadTimeChart 
              deals={deals.map(deal => ({
                ...deal,
                deal_id: deal.deal_id.toString()
              }))} 
              metricTitle={config?.display_title || 'Flow Metric'}
              canonicalStage="Unknown"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Deal List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Deal ID</th>
                        <th className="text-left p-2">Start Date</th>
                        <th className="text-left p-2">End Date</th>
                        <th className="text-left p-2">Duration (days)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => (
                        <tr key={deal.deal_id} className="border-b">
                          <td className="p-2 font-mono text-xs">{deal.deal_id}</td>
                          <td className="p-2">{new Date(deal.start_date).toLocaleDateString()}</td>
                          <td className="p-2">{new Date(deal.end_date).toLocaleDateString()}</td>
                          <td className="p-2">{(deal.duration_seconds / 86400).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No data available</p>
                <p className="text-sm">No deals found for the selected time period.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Common Footer */}
      <CommonFooter onNewRequest={() => {}} isCreating={false} />
    </div>
  );
}