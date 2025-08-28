'use client';

import React from 'react';
import { Button } from './ui/button';

type ViewMode = 'metrics' | 'raw-data' | 'mappings';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        onClick={() => onViewChange('metrics')}
        variant={currentView === 'metrics' ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'metrics'
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Metrics
      </Button>
      <Button
        onClick={() => onViewChange('raw-data')}
        variant={currentView === 'raw-data' ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'raw-data'
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Raw Data
      </Button>
      <Button
        onClick={() => onViewChange('mappings')}
        variant={currentView === 'mappings' ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === 'mappings'
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Mappings
      </Button>
    </div>
  );
};
