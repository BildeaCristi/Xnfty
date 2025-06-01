import { create } from 'zustand';
import { MuseumTheme, museumThemes } from '@/components/museum/museumThemes';

interface MuseumState {
  // Theme management
  currentTheme: MuseumTheme;
  themeName: keyof typeof museumThemes;
  setTheme: (themeName: keyof typeof museumThemes) => void;
  
  // Control modes
  controlMode: 'orbit' | 'firstPerson';
  setControlMode: (mode: 'orbit' | 'firstPerson') => void;
  playerSpeed: number;
  setPlayerSpeed: (speed: number) => void;
  
  // UI states
  showThemeSelector: boolean;
  setShowThemeSelector: (show: boolean) => void;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  
  // Performance settings
  quality: 'low' | 'medium' | 'high';
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  
  // Camera settings
  cameraPosition: [number, number, number];
  setCameraPosition: (position: [number, number, number]) => void;
}

export const useMuseumStore = create<MuseumState>((set) => ({
  // Initial theme
  currentTheme: museumThemes.modern,
  themeName: 'modern',
  setTheme: (themeName) => set({ 
    themeName, 
    currentTheme: museumThemes[themeName] 
  }),
  
  // Initial control mode
  controlMode: 'orbit',
  setControlMode: (mode) => set({ controlMode: mode }),
  
  // Initial UI states
  showThemeSelector: true, // Show theme selector on first entry
  setShowThemeSelector: (show) => set({ showThemeSelector: show }),
  showControls: true,
  setShowControls: (show) => set({ showControls: show }),
  
  // Initial quality
  quality: 'high',
  setQuality: (quality) => set({ quality }),
  
  // Initial player speed
  playerSpeed: 10,
  setPlayerSpeed: (speed) => set({ playerSpeed: speed }),
  
  // Initial camera position
  cameraPosition: [0, 0, 0],
  setCameraPosition: (position) => set({ cameraPosition: position }),
})); 