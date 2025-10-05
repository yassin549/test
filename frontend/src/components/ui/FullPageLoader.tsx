import React from 'react';
import { LoadingAviator } from './LoadingAviator';

export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
      <LoadingAviator />
    </div>
  );
};
