import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  title: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>((
  { title, children, ...props },
  ref
) => {
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <title>{title}</title>
      {children}
    </svg>
  );
});

Icon.displayName = 'Icon';
