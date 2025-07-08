"use client";

import { ToggleSwitch } from './index';

interface DisplaySettingsProps {
  quality: 'low' | 'medium';
  setQuality: (quality: 'low' | 'medium') => void;
  shadowsEnabled: boolean;
  setShadowsEnabled: (enabled: boolean) => void;
}

export default function DisplaySettings({
  quality,
  setQuality,
  shadowsEnabled,
  setShadowsEnabled,
}: DisplaySettingsProps) {
  const qualityLevels = ['low', 'medium'] as const;

  return (
    <div className="space-y-6">
      {/* Quality Preset */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quality Preset
        </label>
        <div className="grid grid-cols-3 gap-2">
          {qualityLevels.map((level) => (
            <button
              key={level}
              onClick={() => setQuality(level)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                quality === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-400">Basic Settings</h3>
        
        <ToggleSwitch
          label="Shadows"
          description="Dynamic shadows for objects"
          checked={shadowsEnabled}
          onChange={setShadowsEnabled}
        />
      </div>
    </div>
  );
} 