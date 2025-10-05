import React from 'react';
import { Icon } from './Icon';

interface LoadingAviatorProps {
  size?: number;
  label?: string;
}

export const LoadingAviator: React.FC<LoadingAviatorProps> = ({ size = 64, label = 'Loading...' }) => {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-4">
      <Icon title={label} width={size} height={size} className="animate-spin motion-reduce:hidden">
        {/* Placeholder SVG - replace with actual Aviator logo */}
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Icon>
      <span className="sr-only">{label}</span>
    </div>
  );
};
