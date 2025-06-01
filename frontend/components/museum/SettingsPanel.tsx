"use client";

import { useState } from 'react';
import { X, Settings, Monitor, Palette, Gamepad2, Info } from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';
import { museumThemes } from './museumThemes';
import { animated, useTransition, SpringValues } from '@react-spring/web';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'display' | 'theme' | 'controls' | 'physics'>('display');
  
  const { 
    themeName, 
    setTheme,
    controlMode,
    setControlMode,
    playerSpeed,
    setPlayerSpeed
  } = useMuseumStore();
  
  const {
    quality,
    setQuality,
    shadowsEnabled,
    setShadowsEnabled,
    antialiasingEnabled,
    setAntialiasingEnabled,
    postProcessingEnabled,
    setPostProcessingEnabled,
    physicsConfig,
    updatePhysicsConfig,
    performanceMetrics
  } = useSceneStore();

  // Panel animation
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
  });

  const tabs = [
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'controls', label: 'Controls', icon: Gamepad2 },
    { id: 'physics', label: 'Physics', icon: Settings },
  ];

  return transitions((style: SpringValues<{ opacity: number; transform: string }>, item: boolean) =>
    item ? (
      <div>
        {/* Backdrop */}
        <animated.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          style={{ opacity: style.opacity }}
          onClick={onClose}
        />
        
        {/* Panel */}
        <animated.div
          className="fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-2xl z-50"
          style={style}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'display' && (
                <DisplaySettings
                  quality={quality}
                  setQuality={setQuality}
                  shadowsEnabled={shadowsEnabled}
                  setShadowsEnabled={setShadowsEnabled}
                  antialiasingEnabled={antialiasingEnabled}
                  setAntialiasingEnabled={setAntialiasingEnabled}
                  postProcessingEnabled={postProcessingEnabled}
                  setPostProcessingEnabled={setPostProcessingEnabled}
                  performanceMetrics={performanceMetrics}
                />
              )}

              {activeTab === 'theme' && (
                <ThemeSettings
                  currentTheme={themeName}
                  setTheme={setTheme}
                />
              )}

              {activeTab === 'controls' && (
                <ControlSettings
                  controlMode={controlMode}
                  setControlMode={setControlMode}
                />
              )}

              {activeTab === 'physics' && (
                <PhysicsSettings
                  physicsConfig={physicsConfig}
                  updatePhysicsConfig={updatePhysicsConfig}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info className="w-4 h-4" />
                <span>Press ESC to close settings</span>
              </div>
            </div>
          </div>
        </animated.div>
      </div>
    ) : null
  );
}

// Display Settings Component
function DisplaySettings({
  quality,
  setQuality,
  shadowsEnabled,
  setShadowsEnabled,
  antialiasingEnabled,
  setAntialiasingEnabled,
  postProcessingEnabled,
  setPostProcessingEnabled,
  performanceMetrics,
}: any) {
  const qualityLevels = ['low', 'medium', 'high', 'ultra'];

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
          label="Anti-aliasing"
          description="Smooth edges (performance impact)"
          checked={antialiasingEnabled}
          onChange={setAntialiasingEnabled}
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

// Theme Settings Component
function ThemeSettings({
  currentTheme,
  setTheme,
}: {
  currentTheme: string;
  setTheme: (theme: keyof typeof museumThemes) => void;
}) {
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
                style={{ backgroundColor: theme.lighting.accentColor }}
              />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Control Settings Component
function ControlSettings({
  controlMode,
  setControlMode,
}: {
  controlMode: 'orbit' | 'firstPerson';
  setControlMode: (mode: 'orbit' | 'firstPerson') => void;
}) {
  const { playerSpeed, setPlayerSpeed } = useMuseumStore();
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Camera Mode
        </label>
        <div className="space-y-2">
          <button
            onClick={() => setControlMode('orbit')}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              controlMode === 'orbit'
                ? 'bg-blue-600/20 border-2 border-blue-500'
                : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
            }`}
          >
            <h3 className="text-white font-medium mb-1">Orbit Controls</h3>
            <p className="text-sm text-gray-400">
              Click and drag to rotate, scroll to zoom
            </p>
          </button>

          <button
            onClick={() => setControlMode('firstPerson')}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              controlMode === 'firstPerson'
                ? 'bg-blue-600/20 border-2 border-blue-500'
                : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
            }`}
          >
            <h3 className="text-white font-medium mb-1">First Person</h3>
            <p className="text-sm text-gray-400">
              WASD to move, mouse to look around
            </p>
          </button>
        </div>
      </div>

      {/* Player Speed Control */}
      {controlMode === 'firstPerson' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Movement Speed
          </label>
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={playerSpeed}
            onChange={(e) => setPlayerSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>{playerSpeed} m/s</span>
            <span>Fast</span>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Toggle camera mode</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">C</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Open settings</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">ESC</kbd>
          </div>
          {controlMode === 'firstPerson' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Move</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">WASD</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jump</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Space</kbd>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Physics Settings Component
function PhysicsSettings({
  physicsConfig,
  updatePhysicsConfig,
}: any) {
  return (
    <div className="space-y-6">
      <ToggleSwitch
        label="Enable Physics"
        description="Realistic object interactions"
        checked={physicsConfig.enabled}
        onChange={(enabled) => updatePhysicsConfig({ enabled })}
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
        onChange={(debug) => updatePhysicsConfig({ debug })}
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

// Toggle Switch Component
function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
} 