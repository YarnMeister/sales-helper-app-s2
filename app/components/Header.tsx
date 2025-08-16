import React from 'react';
import { Button } from './ui/button';
import Image from 'next/image';

interface HeaderProps {
  pageTitle: string;
  selectedSalesperson: string;
  onSalespersonChange: (salesperson: string) => void;
  showNewButton: boolean;
  onNewRequest?: () => void;
  isCreating?: boolean;
}

const SALESPEOPLE = ['Luyanda', 'James', 'Stefan', 'all'];

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  selectedSalesperson,
  onSalespersonChange,
  showNewButton,
  onNewRequest,
  isCreating = false
}) => {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg sticky top-0 z-10">
      {/* Top bar with RTSE logo and title */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* RTSE Logo using favicon */}
            <div className="bg-white rounded-lg p-2 shadow-md">
              <Image
                src="/favicon.ico"
                alt="RTSE Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">{pageTitle}</h1>
              <p className="text-red-100 text-sm">Sales Management Platform</p>
            </div>
          </div>
          {showNewButton && onNewRequest && (
            <Button 
              onClick={onNewRequest}
              disabled={isCreating}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
            >
              {isCreating ? 'Creating...' : '✨ New Request'}
            </Button>
          )}
        </div>
      </div>

      {/* Salesperson filter tabs with enhanced design */}
      <div className="px-6 pb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {SALESPEOPLE.map((salesperson) => {
            const isSelected = selectedSalesperson === salesperson;
            const displayName = salesperson === 'all' ? 'All Requests' : salesperson;
            
            return (
              <button
                key={salesperson}
                onClick={() => onSalespersonChange(salesperson)}
                className={`
                  px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 transform hover:scale-105
                  ${isSelected 
                    ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }
                `}
              >
                {displayName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
