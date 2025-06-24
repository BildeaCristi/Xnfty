import { useState, useEffect, useCallback } from 'react';
import { ThemeService, ThemeName } from '@/services/themeService';

export interface UseThemeReturn {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => boolean;
  themeConfig: any;
  themeColors: any;
  themeAssets: any;
  isChangingTheme: boolean;
  availableThemes: ThemeName[];
}

export function useTheme(): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(ThemeService.getCurrentTheme());
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const handleThemeChange = useCallback((newTheme: ThemeName) => {
    setCurrentTheme(newTheme);
    setIsChangingTheme(false);
  }, []);

  useEffect(() => {
    const unsubscribe = ThemeService.onThemeChange(handleThemeChange);
    return unsubscribe;
  }, [handleThemeChange]);

  const setTheme = useCallback((theme: ThemeName): boolean => {
    if (theme === currentTheme) return true;
    
    setIsChangingTheme(true);
    const success = ThemeService.setTheme(theme);
    
    if (!success) {
      setIsChangingTheme(false);
    }
    
    return success;
  }, [currentTheme]);

  const themeConfig = ThemeService.getThemeConfig(currentTheme);
  const themeColors = ThemeService.getThemeColors(currentTheme);
  const themeAssets = ThemeService.getThemeAssets(currentTheme);
  const availableThemes = ThemeService.getAllThemes();

  return {
    currentTheme,
    setTheme,
    themeConfig,
    themeColors,
    themeAssets,
    isChangingTheme,
    availableThemes,
  };
}
