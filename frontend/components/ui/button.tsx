import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}) => {
  // Base button styles
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-300";
  
  // Variant-specific styles
  const variantStyles = {
    default: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600",
    outline: "border bg-transparent hover:bg-black/10",
    ghost: "bg-transparent hover:bg-black/10"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}; 