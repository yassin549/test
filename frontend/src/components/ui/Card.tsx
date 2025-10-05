import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevate?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>((
  { className, elevate = false, children, ...props },
  ref
) => {
  const baseClasses = 'bg-surface/50 backdrop-blur-lg rounded-md shadow-soft';
  const elevationClasses = elevate ? 'transform hover:-translate-y-1 transition-transform duration-short' : '';

  return (
    <div
      className={`${baseClasses} ${elevationClasses} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
