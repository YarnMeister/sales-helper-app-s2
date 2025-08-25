'use client';

import React from 'react';

type ViewMode = 'metrics' | 'raw-data';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewChange('metrics')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'metrics'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Metrics
      </button>
      <button
        onClick={() => onViewChange('raw-data')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'raw-data'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Raw Data
      </button>
    </div>
  );
};
