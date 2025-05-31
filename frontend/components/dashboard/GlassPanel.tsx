"use client";

import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  noBorder?: boolean;
}

export default function GlassPanel({ children, className = "", noBorder = false }: GlassPanelProps) {
  return (
    <div
      className={`
        relative backdrop-blur-xl 
        bg-gradient-to-br from-white/5 to-white/2 dark:from-black/20 dark:to-purple-900/5
        ${noBorder ? '' : 'border border-cyan-500/20'} 
        rounded-xl overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: "0 0 15px rgba(0, 255, 255, 0.2)",
      }}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
      
      {/* Border glow */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-600/10 pointer-events-none" />
      
      {children}
    </div>
  );
} 