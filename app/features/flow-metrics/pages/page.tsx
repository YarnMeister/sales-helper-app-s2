/**
 * Flow Metrics Report Page
 * 
 * Main dashboard page for viewing flow metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommonHeader } from '../../../components/CommonHeader';
import { CommonFooter } from '../../../components/CommonFooter';
import { Button } from '../../../components/ui/button';
import {
  MetricsDashboard,
  ViewToggle,
  FlowDataTable,
  DealInputForm,
  MetricsManagement,
} from '../components';
import { useMetrics, useFlowData } from '../hooks';
import { TIME_PERIODS, DEFAULT_PERIOD, type ViewMode } from '../utils/constants';

export default function FlowMetricsReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get period from URL query parameter, default to '7d'
  const urlPeriod = searchParams.get('period') || DEFAULT_PERIOD;
  const [selectedPeriod, setSelectedPeriod] = useState(urlPeriod);
  const [currentView, setCurrentView] = useState<ViewMode>('metrics');

  // Use custom hooks for data management
  const { metrics, loading: isLoadingMetrics, refresh: refreshMetrics } = useMetrics(selectedPeriod);
  const { data: flowData, loading: isLoadingData, addData: addFlowData } = useFlowData();

  // Sync state with URL changes
  useEffect(() => {
    const currentUrlPeriod = searchParams.get('period') || DEFAULT_PERIOD;
    if (currentUrlPeriod !== selectedPeriod) {
      setSelectedPeriod(currentUrlPeriod);
    }
  }, [searchParams, selectedPeriod]);

  // Update URL when period changes
  const updateUrl = (newPeriod: string) => {
    const newUrl = `/flow-metrics-report?period=${newPeriod}`;
    router.replace(newUrl, { scroll: false });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateUrl(period);
  };

  const handleFetchSuccess = (newData: any[]) => {
    addFlowData(newData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader
        currentPage="Flow Metrics Report"
        onNavigateHome={() => router.push('/')}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title and View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Flow Metrics Report
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track and analyze your sales process efficiency
            </p>
          </div>
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Period Selector (only in metrics view) */}
        {currentView === 'metrics' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <div className="flex gap-2">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(period.value)}
                  className={
                    selectedPeriod === period.value
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : ''
                  }
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'metrics' && (
          <MetricsDashboard
            metrics={metrics}
            loading={isLoadingMetrics}
            selectedPeriod={selectedPeriod}
            onRefresh={refreshMetrics}
          />
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

            <FlowDataTable data={flowData} isLoading={isLoadingData} />
          </>
        )}

        {currentView === 'mappings' && <MetricsManagement />}
      </div>

      {/* Common Footer */}
      <CommonFooter onNewRequest={() => {}} isCreating={false} />
    </div>
  );
}
