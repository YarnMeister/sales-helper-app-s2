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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-3 px-4">
        {/* Deals */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 ${
            isActive('/') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/')}
        >
          <List className="h-5 w-5" />
          <span className="text-xs">Deals</span>
        </Button>

        {/* Check-in */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 ${
            isActive('/check-in') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/check-in')}
        >
          <CheckSquare className="h-5 w-5" />
          <span className="text-xs">Check-in</span>
        </Button>

        {/* Contacts */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 ${
            isActive('/contacts-list') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/contacts-list')}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Contacts</span>
        </Button>

        {/* New Request Button */}
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg transition-all duration-200"
          onClick={onNewRequest}
          disabled={isCreating}
        >
          {isCreating ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>

        {/* Price List */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 min-w-0 ${
            isActive('/price-list') ? 'text-red-600' : 'text-gray-600'
          }`}
          onClick={() => router.push('/price-list')}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs">Price List</span>
        </Button>
      </div>
    </div>
  );
};
