'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommonHeader } from '../../components/CommonHeader';
import { CommonFooter } from '../../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import LeadTimeChart from '../../components/LeadTimeChart';

interface DealData {
  deal_id: string;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

interface CalculatedMetrics {
  average: number;
  best: number;
  worst: number;
  totalDeals: number;
}

interface MetricConfig {
  id: string;
  metric_key: string;
  display_title: string;
  canonical_stage: string;
  is_active: boolean;
}

interface PageProps {
  params: {
    'metric-id': string;
  };
}

// Time period options
const TIME_PERIODS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '14d', label: '14 days', days: 14 },
  { value: '1m', label: '1 month', days: 30 },
  { value: '3m', label: '3 months', days: 90 },
];

export default function FlowMetricDetailPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const metricId = params['metric-id'];
  
  // Get period from URL query parameter, default to '7d'
  const urlPeriod = searchParams.get('period') || '7d';
  const [selectedPeriod, setSelectedPeriod] = useState(urlPeriod);
  const [deals, setDeals] = useState<DealData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricConfig, setMetricConfig] = useState<MetricConfig | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart');

  // Deals are now filtered at the database level, so we use them directly
  const filteredDeals = deals;

  // Calculate metrics from the filtered deals data
  const calculatedMetrics: CalculatedMetrics = useMemo(() => {
    if (!filteredDeals || filteredDeals.length === 0) {
      return {
        average: 0,
        best: 0,
        worst: 0,
        totalDeals: 0
      };
    }

    // Convert duration_seconds to days with precise calculation
    const durationsInDays = filteredDeals.map(deal => 
      Math.round((deal.duration_seconds / 86400) * 100) / 100
    );

    // Calculate average
    const totalDays = durationsInDays.reduce((sum, days) => sum + days, 0);
    const average = Math.round((totalDays / durationsInDays.length) * 100) / 100;

    // Find best (minimum) and worst (maximum)
    const best = Math.min(...durationsInDays);
    const worst = Math.max(...durationsInDays);

    return {
      average,
      best,
      worst,
      totalDeals: filteredDeals.length
    };
  }, [filteredDeals]);

  // Sync state with URL changes
  useEffect(() => {
    const currentUrlPeriod = searchParams.get('period') || '7d';
    if (currentUrlPeriod !== selectedPeriod) {
      setSelectedPeriod(currentUrlPeriod);
    }
  }, [searchParams, selectedPeriod]);

  // Update URL when period changes (but avoid circular updates)
  const updateUrl = (newPeriod: string) => {
    const newUrl = `/flow-metrics-report/${metricId}?period=${newPeriod}`;
    router.replace(newUrl, { scroll: false });
  };

  // Fetch metric configuration from database
  useEffect(() => {
    const fetchMetricConfig = async () => {
      try {
        const response = await fetch('/api/admin/flow-metrics-config');
        const result = await response.json();
        
        if (result.success) {
          const metric = result.data.find((m: any) => m.metric_key === metricId);
          if (metric) {
            setMetricConfig(metric);
          } else {
            setError('Metric not found');
            setIsLoading(false);
          }
        } else {
          setError('Failed to fetch metric configuration');
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch metric configuration');
        setIsLoading(false);
      }
    };

    fetchMetricConfig();
  }, [metricId]);

  // Fetch deals data for the canonical stage with period filtering
  useEffect(() => {
    const fetchDeals = async () => {
      if (!metricConfig?.canonical_stage) {
        return; // Wait for metric config to load
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/flow/canonical-stage-deals?canonicalStage=${encodeURIComponent(metricConfig.canonical_stage)}&period=${selectedPeriod}`);
        const result = await response.json();

        if (result.success) {
          setDeals(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch deals data');
        }
      } catch (err) {
        setError('Failed to fetch deals data');
        console.error('Error fetching deals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [metricConfig?.canonical_stage, selectedPeriod]);

  if (error && !metricConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader title="Metric Not Found" showDivider={false} />
        <div className="px-4 py-4 pb-24">
          <p className="text-gray-600">{error}</p>
        </div>
        <CommonFooter onNewRequest={() => {}} isCreating={false} />
      </div>
    );
  }

  const handleBack = () => {
    // Preserve the selected period when going back to the main page
    router.push(`/flow-metrics-report?period=${selectedPeriod}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{metricConfig?.display_title || 'Loading...'}</h1>
              <p className="text-gray-600">
                {TIME_PERIODS.find(p => p.value === selectedPeriod)?.label || 'Last 7 days'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* Time Period Selectors */}
        <div className="mb-6">
          {/* Desktop: Row of buttons */}
          <div className="hidden md:block">
            <div className="flex gap-2">
              {TIME_PERIODS.map((period) => (
                                    <Button
                      key={period.value}
                      variant={selectedPeriod === period.value ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 ${selectedPeriod === period.value ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                      onClick={() => {
                        setSelectedPeriod(period.value);
                        updateUrl(period.value);
                      }}
                    >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mobile: Dropdown */}
          <div className="md:hidden">
                            <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    updateUrl(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
              {TIME_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : Math.round(calculatedMetrics.average)} days
              </div>
              {!isLoading && calculatedMetrics.totalDeals > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Based on {calculatedMetrics.totalDeals} deals
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Best Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : Math.round(calculatedMetrics.best)} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Worst Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : Math.round(calculatedMetrics.worst)} days
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Deal Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <CardTitle className="text-lg">Individual Deal Performance</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                  className={`text-xs ${
                    viewMode === 'chart'
                      ? 'bg-gray-700 hover:bg-gray-800 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chart View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`text-xs ${
                    viewMode === 'list'
                      ? 'bg-gray-700 hover:bg-gray-800 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading deals data...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">
                  No deals found for this canonical stage in the selected time period
                </div>
              </div>
            ) : viewMode === 'chart' ? (
              <LeadTimeChart 
                deals={filteredDeals}
                metricTitle={metricConfig?.display_title || 'Lead Time'}
                canonicalStage={metricConfig?.canonical_stage || ''}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Deal ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((deal) => {
                      const durationDays = Math.round(deal.duration_seconds / 86400);
                      const startDate = new Date(deal.start_date).toLocaleDateString();
                      const endDate = new Date(deal.end_date).toLocaleDateString();
                      
                      // Highlight best and worst performers (using precise values for comparison)
                      const preciseDuration = Math.round((deal.duration_seconds / 86400) * 100) / 100;
                      const isBest = preciseDuration === calculatedMetrics.best;
                      const isWorst = preciseDuration === calculatedMetrics.worst;
                      
                      return (
                        <tr 
                          key={deal.deal_id} 
                          className={`border-b border-gray-100 ${
                            isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">{deal.deal_id}</td>
                          <td className="py-3 px-4 text-gray-700">{startDate}</td>
                          <td className="py-3 px-4 text-gray-700">{endDate}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              isBest ? 'text-green-600' : 
                              isWorst ? 'text-red-600' : 
                              'text-gray-900'
                            }`}>
                              {durationDays} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Footer */}
      <CommonFooter onNewRequest={() => {}} isCreating={false} />
    </div>
  );
}
