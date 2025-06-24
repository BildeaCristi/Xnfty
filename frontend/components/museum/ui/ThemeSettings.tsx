"use client";

import { museumThemes } from '@/config/museumThemes';

interface ThemeSettingsProps {
  currentTheme: string;
  setTheme: (theme: keyof typeof museumThemes) => void;
}

export default function ThemeSettings({
  currentTheme,
  setTheme,
}: ThemeSettingsProps) {
  return (
    <div className="space-y-4">
      {Object.entries(museumThemes).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => setTheme(key as keyof typeof museumThemes)}
          className={`w-full p-4 rounded-lg transition-all ${
            currentTheme === key
              ? 'bg-blue-600/20 border-2 border-blue-500'
              : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
          }`}
        >
          <div className="text-left">
            <h3 className="text-white font-medium mb-1">{theme.name}</h3>
            <p className="text-sm text-gray-400">{theme.description}</p>
            <div className="flex gap-2 mt-3">
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={{ backgroundColor: theme.room.wallColor }}
              />
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={{ backgroundColor: theme.room.floorColor }}
              />
                             <div
                 className="w-8 h-8 rounded border border-gray-700"
                 style={{ backgroundColor: theme.frame.defaultColor }}
               />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 