"use client";

import { useState } from 'react';
import { X, Settings, Monitor, Palette, Gamepad2, Info } from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';
import { animated, useTransition, SpringValues } from '@react-spring/web';
import { DisplaySettings, ThemeSettings, ControlSettings, PhysicsSettings } from './ui';

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