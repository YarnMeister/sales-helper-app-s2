import React, { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { SalespersonModal } from './SalespersonModal';
import { useRouter, usePathname } from 'next/navigation';

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
    if (onShowSalespersonModal) {
      onShowSalespersonModal();
    }
  };

  return (
    <>
      <BottomNavigation onNewRequest={handlePlusClick} isCreating={isCreating} />
    </>
  );
};
