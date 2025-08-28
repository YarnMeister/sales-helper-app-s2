'use client';

import React, { useState, useEffect } from 'react';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { DealInputForm } from '../components/DealInputForm';
import FlowDataTable from '../components/FlowDataTable';
import { ViewToggle } from '../components/ViewToggle';
import { MetricsManagement } from '../components/MetricsManagement';

// Time period options
const TIME_PERIODS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '14d', label: '14 days', days: 14 },
  { value: '1m', label: '1 month', days: 30 },
  { value: '3m', label: '3 months', days: 90 },
];

// Interface for flow metric data
interface FlowMetricData {
  id: string;
  title: string;
  mainMetric: string;
  best: string;
  worst: string;
  trend: 'up' | 'down' | 'stable';
}

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
const KPICard = ({ data, selectedPeriod }: { data: FlowMetricData; selectedPeriod: string }) => {
  const router = useRouter();
  
  const handleMoreInfo = () => {
    // Navigate to the detail page with the selected period
    router.push(`/flow-metrics-report/${data.id}?period=${selectedPeriod}`);
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
          className="w-full mt-2 border-green-700 text-green-700 hover:bg-green-50"
        >
          More info
        </Button>
      </CardContent>
    </Card>
  );
};

export default function FlowMetricsReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get period from URL query parameter, default to '7d'
  const urlPeriod = searchParams.get('period') || '7d';
  const [selectedPeriod, setSelectedPeriod] = useState(urlPeriod);
  const [metricsData, setMetricsData] = useState<FlowMetricData[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [currentView, setCurrentView] = useState<'metrics' | 'raw-data' | 'mappings'>('metrics');
  const [flowData, setFlowData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);


  // Load active metrics from database
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoadingMetrics(true);
        
        // Fetch calculated metrics from the new API endpoint
        const response = await fetch(`/api/flow/metrics?period=${selectedPeriod}`);
        const result = await response.json();
        
        if (result.success) {
          // Convert API response to the format expected by KPICard
          const activeMetrics = result.data.map((metric: any) => ({
            id: metric.id,
            title: metric.title,
            mainMetric: `${metric.mainMetric} days`,
            best: `${metric.best} days`,
            worst: `${metric.worst} days`,
            trend: metric.trend,
          }));
          
          setMetricsData(activeMetrics);
        } else {
          console.error('Failed to fetch metrics:', result.error);
          setMetricsData([]);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setMetricsData([]);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [selectedPeriod]);

  // Sync state with URL changes
  useEffect(() => {
    const currentUrlPeriod = searchParams.get('period') || '7d';
    if (currentUrlPeriod !== selectedPeriod) {
      setSelectedPeriod(currentUrlPeriod);
    }
  }, [searchParams, selectedPeriod]);

  // Update URL when period changes (but avoid circular updates)
  const updateUrl = (newPeriod: string) => {
    const newUrl = `/flow-metrics-report?period=${newPeriod}`;
    router.replace(newUrl, { scroll: false });
  };

  // Load existing flow data on component mount
  useEffect(() => {
    loadExistingFlowData();
  }, []);

  const loadExistingFlowData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/pipedrive/deal-flow-data');
      const result = await response.json();
      
      if (result.success) {
        setFlowData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading existing flow data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFetchSuccess = (newData: any[]) => {
    // Add new data to existing data, avoiding duplicates
    setFlowData(prevData => {
      const existingIds = new Set(prevData.map(item => item.id));
      const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
      return [...uniqueNewData, ...prevData];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Flow Metrics Report" showDivider={false} />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {/* View Toggle - On its own row */}
        <div className="mb-6">
          <ViewToggle 
            currentView={currentView} 
            onViewChange={setCurrentView} 
          />
        </div>

        {/* Content based on current view */}
        {currentView === 'metrics' && (
          <>
            {/* Header Section - Moved down one row */}
            <div className="mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Lead Time Overview
                </h1>
                <p className="text-gray-600 mt-1">
                  Track efficiency across your sales pipeline stages
                </p>
              </div>
            </div>

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

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingMetrics ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading metrics...</div>
                </div>
              ) : metricsData.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="text-gray-500">No active metrics found. Add metrics in the Mappings tab.</div>
                </div>
              ) : (
                metricsData.map((metric) => (
                  <KPICard key={metric.id} data={metric} selectedPeriod={selectedPeriod} />
                ))
              )}
            </div>
          </>
        )}
        
        {currentView === 'raw-data' && (
          <>
            {/* Deal Input Form - Only visible in Raw Data view */}
            <div className="mb-6">
              <DealInputForm 
                onFetchSuccess={handleFetchSuccess}
                isLoading={isLoadingData}
              />
            </div>
            
            <FlowDataTable 
              data={flowData} 
              isLoading={isLoadingData}
            />
          </>
        )}
        
        {currentView === 'mappings' && (
          <MetricsManagement />
        )}
      </div>

      {/* Common Footer */}
      <CommonFooter 
        onNewRequest={() => {}} 
        isCreating={false}
      />
    </div>
  );
}
