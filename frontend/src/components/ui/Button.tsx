import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((
  { className, variant = 'primary', loading = false, children, ...props },
  ref
) => {
  const baseClasses = 'px-4 py-2 rounded-full font-bold transition-all duration-quick';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-700 active:scale-95',
    ghost: 'bg-transparent text-text hover:bg-surface active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-700 active:scale-95',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
});

Button.displayName = 'Button';
