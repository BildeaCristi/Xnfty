"use client";

import { useMuseumStore } from '@/store/MuseumStore';

interface ControlSettingsProps {
  controlMode: 'orbit' | 'firstPerson';
  setControlMode: (mode: 'orbit' | 'firstPerson') => void;
}

export default function ControlSettings({
  controlMode,
  setControlMode,
}: ControlSettingsProps) {
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