'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

interface HamburgerMenuProps {
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`flex flex-col items-center gap-1 min-w-0 relative ${className}`}
        onClick={handleMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="text-xs">Menu</span>
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={handleOverlayClick}
          data-testid="overlay"
        />
      )}

      {/* Slide-out Menu */}
      {isOpen && (
        <div 
          className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
        >
          {/* Close Button */}
          <div className="flex justify-end p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMenuClick}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="px-4 pb-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left p-3 hover:bg-gray-100"
                onClick={() => handleMenuItemClick('/flow-metrics-report')}
              >
                Flow Metrics Report
              </Button>
              {/* Add more menu items here as needed */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
