"use client";

import { ReactNode, useEffect, useRef } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  noBorder?: boolean;
}

export default function GlassPanel({ children, className = "", noBorder = false }: GlassPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Calculate the tilt effect - stronger when mouse is over the panel
      const isOver = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      const tiltX = isOver ? (y - 0.5) * 5 : 0;
      const tiltY = isOver ? (x - 0.5) * -5 : 0;
      
      // Apply a subtle tilt effect
      panelRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      
      // Highlight effect when mouse is over
      if (isOver) {
        panelRef.current.style.boxShadow = "0 0 25px rgba(0, 255, 255, 0.5)";
      } else {
        panelRef.current.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.2)";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={panelRef}
      className={`
        relative backdrop-blur-xl 
        bg-gradient-to-br from-white/5 to-white/2 dark:from-black/20 dark:to-purple-900/5
        ${noBorder ? '' : 'border border-cyan-500/20'} 
        rounded-xl overflow-hidden
        transition-all duration-300
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