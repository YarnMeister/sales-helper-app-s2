import React, { useState } from 'react';
import { Button } from './ui/button';
import { Package, User, Plus, Filter, List, CheckSquare } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { SalespersonModal } from './SalespersonModal';
import { useRouter, usePathname } from 'next/navigation';
import { generateQRId } from '@/lib/client-qr-generator';

interface CommonFooterProps {
  onNewRequest?: () => void;
  isCreating?: boolean;
  selectedSalesperson?: string;
  onSalespersonChange?: (salesperson: string) => void;
  onShowSalespersonModal?: () => void;
}

export const CommonFooter: React.FC<CommonFooterProps> = ({ 
  onNewRequest, 
  isCreating = false,
  selectedSalesperson = 'All requests',
  onSalespersonChange,
  onShowSalespersonModal
}) => {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMainPage = pathname === '/';

  const isActive = (path: string) => pathname === path;

  const handlePlusClick = () => {
    // If we're on main page and have a specific salesperson selected, create request directly
    if (isMainPage && selectedSalesperson && selectedSalesperson !== 'All requests') {
      if (onNewRequest) {
        onNewRequest();
      }
      return;
    }

    // If we're on main page but no specific salesperson, show modal
    if (isMainPage && onShowSalespersonModal) {
      onShowSalespersonModal();
      return;
    }

    // For non-main pages, show our own modal
    setShowModal(true);
  };

  const handleSalespersonSelect = async (salesperson: string) => {
    setShowModal(false);
    
    // Generate QR-ID client-side (consistent with main page approach)
    const requestId = generateQRId();
    console.log('🔍 Generated client-side QR-ID for non-main page:', requestId);
    
    // Create new request by calling the API
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId, // Send the client-generated ID
          salespersonFirstName: salesperson,
        })
      });

      if (response.ok) {
        // Navigate to main page and scroll to top
        router.push('/');
        // Small delay to ensure navigation completes before scrolling
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        console.error('Failed to create new request');
        alert('Failed to create new request. Please try again.');
      }
    } catch (error) {
      console.error('Error creating new request:', error);
      alert('Failed to create new request. Please try again.');
    }
  };

  return (
    <>
      {/* Bottom Navigation */}
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
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
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
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            )}
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs">Check-in</span>
          </Button>

          {/* New Request Button */}
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-[0_6px_12px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 transform hover:scale-105"
            onClick={handlePlusClick}
            disabled={isCreating}
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : (
              <Plus className="h-6 w-6 drop-shadow-md" />
            )}
          </Button>

          {/* Quick Lookup */}
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 min-w-0 relative ${
              isActive('/quick-lookup') ? 'text-red-600' : 'text-gray-600'
            }`}
            onClick={() => router.push('/quick-lookup')}
          >
            {isActive('/quick-lookup') && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
            )}
            <User className="h-5 w-5" />
            <span className="text-xs">Lookup</span>
          </Button>

          {/* Hamburger Menu */}
          <HamburgerMenu 
            className={`flex flex-col items-center gap-1 min-w-0 relative ${
              isActive('/flow-metrics-report') ? 'text-red-600' : 'text-gray-600'
            }`}
          />
        </div>
      </div>
      
      {/* Salesperson Modal for non-main pages */}
      <SalespersonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSalespersonSelect}
        title="Select salesperson for new request"
      />
    </>
  );
};
