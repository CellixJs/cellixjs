import type React from 'react';

interface LinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({ to, className, children, ...props }) => (
  <a href={to} className={className} {...props} data-testid="docusaurus-link">
    {children}
  </a>
);

export default Link;
