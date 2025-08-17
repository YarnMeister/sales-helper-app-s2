import React from 'react';
import { BottomNavigation } from './BottomNavigation';

interface CommonFooterProps {
  onNewRequest?: () => void;
  isCreating?: boolean;
}

export const CommonFooter: React.FC<CommonFooterProps> = ({ 
  onNewRequest, 
  isCreating = false 
}) => {
  return (
    <BottomNavigation onNewRequest={onNewRequest} isCreating={isCreating} />
  );
};
