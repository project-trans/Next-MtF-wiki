'use client';
import React from 'react';
import { Link, type LinkProps } from './progress';

const DropdownLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function DropdownLink({ children, href, ...rest }, ref) {
    return (
      <Link
        href={href}
        ref={ref}
        {...rest}
        onClick={(e) => {
          if (rest.onClick) {
            rest.onClick(e);
          }
          (document.activeElement as HTMLElement).blur();
        }}
      >
        {children}
      </Link>
    );
  },
);
export default DropdownLink;
