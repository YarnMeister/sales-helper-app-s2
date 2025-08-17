import React from 'react';
import { RTSElogo } from './RTSElogo';

interface CommonHeaderProps {
  title: string;
  showDivider?: boolean;
}

export const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  title, 
  showDivider = true 
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="px-4 py-4">
        {/* Header with RTSE Logo and Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-shrink-0">
            <RTSElogo size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Horizontal line with 3D effect */}
        {showDivider && (
          <div className="w-screen h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.1)] -mx-4"></div>
        )}
      </div>
    </div>
  );
};
