'use client';

import React from 'react';
import { Button } from './ui/button';
import { Package, User, Plus, Filter, List, CheckSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface BottomNavigationProps {
  onNewRequest?: () => void;
  isCreating?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onNewRequest,
  isCreating
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-4 px-4 pb-6">
        {/* Deals */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 relative ${
            isActive('/') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/')}
        >
          {isActive('/') && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
          )}
          <List className="h-5 w-5" />
          <span className="text-xs">Deals</span>
        </Button>

        {/* Check-in */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 relative ${
            isActive('/check-in') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/check-in')}
        >
          {isActive('/check-in') && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
          )}
          <CheckSquare className="h-5 w-5" />
          <span className="text-xs">Check-in</span>
        </Button>

        {/* New Request Button */}
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.3)] transition-all duration-200 transform hover:scale-105"
          onClick={onNewRequest}
          disabled={isCreating}
        >
          {isCreating ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          ) : (
            <Plus className="h-6 w-6 drop-shadow-sm" />
          )}
        </Button>

        {/* Contacts */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 relative ${
            isActive('/contacts-list') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/contacts-list')}
        >
          {isActive('/contacts-list') && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
          )}
          <User className="h-5 w-5" />
          <span className="text-xs">Contacts</span>
        </Button>

        {/* Price List */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 relative ${
            isActive('/price-list') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/price-list')}
        >
          {isActive('/price-list') && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
          )}
          <Package className="h-5 w-5" />
          <span className="text-xs">Price List</span>
        </Button>
      </div>
    </div>
  );
};
