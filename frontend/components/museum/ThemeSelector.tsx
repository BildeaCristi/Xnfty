"use client";

import {useMuseumStore} from '@/store/MuseumStore';
import {museumConfig} from '../../config/museumThemes';
import {Eye, Gamepad2, Palette, Settings, X} from 'lucide-react';

export default function ThemeSelector() {
    const {
        showThemeSelector,
        setShowThemeSelector,
        setTheme,
        themeName,
        controlMode,
        setControlMode,
        quality,
        setQuality
    } = useMuseumStore();

    if (!showThemeSelector) return null;

    const handleEnterMuseum = () => {
        setShowThemeSelector(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
                className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Palette className="w-8 h-8 text-blue-400"/>
                        <h2 className="text-3xl font-bold text-white">Welcome to 3D Museum</h2>
                    </div>
                    <button
                        onClick={handleEnterMuseum}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* Theme Selection */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-blue-400"/>
                        Choose Your Museum Theme
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(museumConfig).map(([key, theme]) => (
                            <button
                                key={key}
                                onClick={() => setTheme(key as keyof typeof museumConfig)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    themeName === key
                                        ? 'border-blue-500 bg-blue-500/20'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                }`}
                            >
                                <div className="text-left">
                                    <h4 className="text-lg font-semibold text-white mb-1">{theme.name}</h4>
                                    <p className="text-sm text-gray-400">{theme.description}</p>

                                    {/* Theme preview colors */}
                                    <div className="flex space-x-2 mt-3">
                                        <div
                                            className="w-8 h-8 rounded-full border border-gray-600"
                                            style={{backgroundColor: theme.room.wallColor}}
                                            title="Wall Color"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-full border border-gray-600"
                                            style={{backgroundColor: theme.room.floorColor}}
                                            title="Floor Color"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-full border border-gray-600"
                                            style={{backgroundColor: theme.lighting.accentColor}}
                                            title="Accent Color"
                                        />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Control Settings */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Gamepad2 className="w-5 h-5 mr-2 text-purple-400"/>
                        Navigation Controls
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setControlMode('orbit')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                controlMode === 'orbit'
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                        >
                            <h4 className="text-lg font-semibold text-white mb-1">Orbit Controls</h4>
                            <p className="text-sm text-gray-400">Click and drag to rotate • Scroll to zoom</p>
                        </button>
                        <button
                            onClick={() => setControlMode('firstPerson')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                controlMode === 'firstPerson'
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                        >
                            <h4 className="text-lg font-semibold text-white mb-1">First Person</h4>
                            <p className="text-sm text-gray-400">WASD to move • Mouse to look • Space to jump</p>
                        </button>
                    </div>
                </div>

                {/* Quality Settings */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-green-400"/>
                        Performance Quality
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(['low', 'medium', 'high'] as const).map((q) => (
                            <button
                                key={q}
                                onClick={() => setQuality(q)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    quality === q
                                        ? 'border-green-500 bg-green-500/20'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                }`}
                            >
                                <h4 className="text-lg font-semibold text-white capitalize">{q}</h4>
                                <p className="text-xs text-gray-400">
                                    {q === 'low' && 'Better performance'}
                                    {q === 'medium' && 'Balanced'}
                                    {q === 'high' && 'Best visuals'}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enter Button */}
                <button
                    onClick={handleEnterMuseum}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Enter Museum
                </button>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 text-center">
                        You can change these settings anytime by pressing <kbd
                        className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> in the museum
                    </p>
                </div>
            </div>
        </div>
    );
} 