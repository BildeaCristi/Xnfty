import React from 'react';

interface GridBoxProps {
  children: React.ReactNode;
  className?: string;
}

const GridBox: React.FC<GridBoxProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`
        bg-gray-900/60 
        backdrop-blur-sm 
        border border-gray-800 
        hover:border-cyan-500/30 
        rounded-lg 
        overflow-hidden 
        transition-all 
        duration-300 
        hover:shadow-[0_0_15px_rgba(0,255,255,0.1)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GridBox; 