import React from 'react';

interface RTSElogoProps {
  size?: number;
  className?: string;
}

export const RTSElogo: React.FC<RTSElogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <div 
      className={`bg-red-600 rounded-md flex items-center justify-center text-white font-bold ${className}`}
      style={{ 
        width: `${size * 1.43}px`, 
        height: `${size}px`,
        fontSize: `${Math.max(size * 0.4, 12) + 1}px`
      }}
    >
      RTSE
    </div>
  );
};
