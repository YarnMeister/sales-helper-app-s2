import React, { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { SalespersonModal } from './SalespersonModal';
import { useRouter, usePathname } from 'next/navigation';

interface CommonFooterProps {
  onNewRequest?: () => void;
  isCreating?: boolean;
  selectedSalesperson?: string;
  onSalespersonChange?: (salesperson: string) => void;
}

export const CommonFooter: React.FC<CommonFooterProps> = ({ 
  onNewRequest, 
  isCreating = false,
  selectedSalesperson = 'James',
  onSalespersonChange
}) => {
  const [showSalespersonModal, setShowSalespersonModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMainPage = pathname === '/';

  const handlePlusClick = () => {
    // If we're on main page and have a specific salesperson selected, create request directly
    if (isMainPage && selectedSalesperson && selectedSalesperson !== 'All requests') {
      if (onNewRequest) {
        onNewRequest();
      }
      return;
    }

    // For all other cases, show the salesperson modal
    setShowSalespersonModal(true);
  };

  const handleSalespersonSelect = (salesperson: string) => {
    setShowSalespersonModal(false);
    
    // If we're not on main page, navigate there first
    if (!isMainPage) {
      // Store the selected salesperson in sessionStorage for main page to pick up
      sessionStorage.setItem('selectedSalesperson', salesperson);
      router.push('/');
      return;
    }

    // If we're on main page, update the salesperson and create request
    if (onSalespersonChange) {
      onSalespersonChange(salesperson);
    }
    
    // Create the request with the selected salesperson
    if (onNewRequest) {
      // We need to trigger the request creation with the new salesperson
      // This will be handled by the main page's logic
      setTimeout(() => {
        onNewRequest();
      }, 100);
    }
  };

  return (
    <>
      <BottomNavigation onNewRequest={handlePlusClick} isCreating={isCreating} />
      <SalespersonModal 
        isOpen={showSalespersonModal} 
        onClose={() => setShowSalespersonModal(false)} 
        onSelect={handleSalespersonSelect} 
      />
    </>
  );
};
