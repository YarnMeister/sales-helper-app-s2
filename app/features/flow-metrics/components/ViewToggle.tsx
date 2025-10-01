/**
 * ViewToggle Component
 * 
 * Toggle between different views in the flow metrics page
 */

'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { VIEW_MODES, type ViewMode } from '../utils/constants';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        onClick={() => onViewChange(VIEW_MODES.METRICS)}
        variant={currentView === VIEW_MODES.METRICS ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === VIEW_MODES.METRICS
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Metrics
      </Button>
      <Button
        onClick={() => onViewChange(VIEW_MODES.RAW_DATA)}
        variant={currentView === VIEW_MODES.RAW_DATA ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === VIEW_MODES.RAW_DATA
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Raw Data
      </Button>
      <Button
        onClick={() => onViewChange(VIEW_MODES.MAPPINGS)}
        variant={currentView === VIEW_MODES.MAPPINGS ? 'default' : 'ghost'}
        size="sm"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentView === VIEW_MODES.MAPPINGS
            ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Mappings
      </Button>
    </div>
  );
}
