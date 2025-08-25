'use client';

import React from 'react';
import { CommonHeader } from '../components/CommonHeader';
import { CommonFooter } from '../components/CommonFooter';

export default function FlowMetricsReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <CommonHeader title="Flow Metrics Report" showDivider={false} />

      {/* Main Content - Left blank as requested */}
      <div className="px-4 py-4 pb-24">
        {/* Content will be added in future iterations */}
      </div>

      {/* Common Footer */}
      <CommonFooter 
        onNewRequest={() => {}} 
        isCreating={false}
      />
    </div>
  );
}
