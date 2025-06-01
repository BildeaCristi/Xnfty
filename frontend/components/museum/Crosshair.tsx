"use client";

interface CrosshairProps {
  isHovering: boolean;
  isFirstPerson: boolean;
  onInteract?: () => void;
}

export default function Crosshair({ isHovering, isFirstPerson, onInteract }: CrosshairProps) {
  if (!isFirstPerson) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      {/* Crosshair */}
      <div className="relative">
        {/* Center dot */}
        <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
          isHovering ? 'bg-blue-400 scale-125' : 'bg-white/80'
        }`} />

        {/* Optional: Crosshair lines */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
          isHovering ? 'opacity-100' : 'opacity-50'
        }`}>
          {/* Horizontal line */}
          <div className={`absolute h-[1px] w-4 -left-2 top-1/2 -translate-y-1/2 ${
            isHovering ? 'bg-blue-400' : 'bg-white/60'
          }`} />
          <div className={`absolute h-[1px] w-4 -right-2 top-1/2 -translate-y-1/2 ${
            isHovering ? 'bg-blue-400' : 'bg-white/60'
          }`} />
          {/* Vertical line */}
          <div className={`absolute w-[1px] h-4 left-1/2 -top-2 -translate-x-1/2 ${
            isHovering ? 'bg-blue-400' : 'bg-white/60'
          }`} />
          <div className={`absolute w-[1px] h-4 left-1/2 -bottom-2 -translate-x-1/2 ${
            isHovering ? 'bg-blue-400' : 'bg-white/60'
          }`} />
        </div>

        {/* Click hint */}
        {isHovering && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-xs bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
            Click to view NFT
          </div>
        )}
      </div>
    </div>
  );
} 