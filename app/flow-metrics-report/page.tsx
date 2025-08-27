'use client';

import React, { useState, useEffect } from 'react';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/navigation';
import { DealInputForm } from '../components/DealInputForm';
import FlowDataTable from '../components/FlowDataTable';
import { ViewToggle } from '../components/ViewToggle';
import { MetricsManagement } from '../components/MetricsManagement';

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
const KPICard = ({ data }: { data: FlowMetricData }) => {
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
          className="w-full mt-2 border-green-700 text-green-700 hover:bg-green-50"
        >
          More info
        </Button>
      </CardContent>
    </Card>
  );
};

export default function FlowMetricsReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
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
        const response = await fetch('/api/admin/flow-metrics-config');
        const result = await response.json();
        
        if (result.success) {
          // Convert database data to the format expected by KPICard
          const activeMetrics = result.data
            .filter((metric: any) => metric.is_active)
            .map((metric: any) => ({
              id: metric.metric_key,
              title: metric.display_title,
              mainMetric: 'Calculating...', // TODO: Calculate actual metrics
              best: 'N/A',
              worst: 'N/A',
              trend: 'stable' as const,
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
  }, []);

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
            
            {/* View Toggle */}
            <ViewToggle 
              currentView={currentView} 
              onViewChange={setCurrentView} 
            />
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'metrics' && (
          <>
            {/* Period Selector for Metrics View */}
            <div className="mb-6">
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
                  <KPICard key={metric.id} data={metric} />
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
