/**
 * Flow Metric Detail Page - Test Version
 */

'use client';

import React from 'react';

interface PageProps {
  params: {
    'metric-id': string;
  };
}

export default function FlowMetricDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1>Flow Metric Detail Page</h1>
        <p>Metric ID: {params['metric-id']}</p>
      </div>
    </div>
  );
}
