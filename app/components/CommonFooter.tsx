import React, { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
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
      <BottomNavigation onNewRequest={handlePlusClick} isCreating={isCreating} />
      
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
