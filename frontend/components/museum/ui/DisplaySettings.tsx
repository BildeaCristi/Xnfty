"use client";

import { ToggleSwitch } from './index';

interface DisplaySettingsProps {
  quality: string;
  setQuality: (quality: string) => void;
  shadowsEnabled: boolean;
  setShadowsEnabled: (enabled: boolean) => void;
  postProcessingEnabled: boolean;
  setPostProcessingEnabled: (enabled: boolean) => void;
  performanceMetrics: {
    fps: number;
    drawCalls: number;
  };
}

export default function DisplaySettings({
  quality,
  setQuality,
  shadowsEnabled,
  setShadowsEnabled,
  postProcessingEnabled,
  setPostProcessingEnabled,
  performanceMetrics,
}: DisplaySettingsProps) {
  const qualityLevels = ['low', 'medium', 'high'];

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Performance</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">FPS:</span>
            <span className="ml-2 text-white font-mono">{performanceMetrics.fps.toFixed(0)}</span>
          </div>
          <div>
            <span className="text-gray-500">Draw Calls:</span>
            <span className="ml-2 text-white font-mono">{performanceMetrics.drawCalls}</span>
          </div>
        </div>
      </div>

      {/* Quality Preset */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quality Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
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
        <h3 className="text-sm font-medium text-gray-400">Advanced Settings</h3>
        
        <ToggleSwitch
          label="Shadows"
          description="Dynamic shadows for objects"
          checked={shadowsEnabled}
          onChange={setShadowsEnabled}
        />

        <ToggleSwitch
          label="Post-processing"
          description="Visual effects like bloom and SSAO"
          checked={postProcessingEnabled}
          onChange={setPostProcessingEnabled}
        />
      </div>
    </div>
  );
} 