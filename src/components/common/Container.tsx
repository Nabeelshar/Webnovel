
import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '', 
  noPadding = false 
}) => {
  return (
    <div 
      className={`max-w-7xl mx-auto ${
        noPadding ? '' : 'px-4 sm:px-6 lg:px-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
