import type React from 'react';

interface HeadingProps {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  children: React.ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ as: Component, className, children }) => (
  <Component className={className} data-testid="heading">
    {children}
  </Component>
);

export default Heading;
