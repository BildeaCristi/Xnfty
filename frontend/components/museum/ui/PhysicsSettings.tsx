"use client";

import { ToggleSwitch } from './index';

interface PhysicsConfig {
  timeStep: number | "vary" | undefined;
  enabled: boolean;
  gravity: [number, number, number];
  debug: boolean;
}

interface PhysicsSettingsProps {
  physicsConfig: PhysicsConfig;
  updatePhysicsConfig: (config: Partial<PhysicsConfig>) => void;
}

export default function PhysicsSettings({
  physicsConfig,
  updatePhysicsConfig,
}: PhysicsSettingsProps) {
  return (
    <div className="space-y-6">
      <ToggleSwitch
        label="Enable Physics"
        description="Realistic object interactions"
        checked={physicsConfig.enabled}
        onChange={(enabled: boolean) => updatePhysicsConfig({ enabled })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Gravity Strength
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.1"
          value={Math.abs(physicsConfig.gravity[1])}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            updatePhysicsConfig({
              gravity: [0, -value, 0],
            });
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Zero</span>
          <span>{Math.abs(physicsConfig.gravity[1]).toFixed(1)} m/s²</span>
          <span>Strong</span>
        </div>
      </div>

      <ToggleSwitch
        label="Debug Visualization"
        description="Show physics colliders"
        checked={physicsConfig.debug}
        onChange={(debug: boolean) => updatePhysicsConfig({ debug })}
      />

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Info</h3>
        <p className="text-sm text-gray-500">
          Physics simulation adds realism but may impact performance on lower-end devices.
        </p>
      </div>
    </div>
  );
} 