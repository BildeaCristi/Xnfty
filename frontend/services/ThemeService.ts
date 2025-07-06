import { Color } from 'three';
import { UNIFIED_LIGHTING } from '@/config/museumConfig';
import { ASSET_PATHS } from '@/config/assetConfig';
import { MUSEUM_THEMES, MuseumTheme } from '@/utils/constants/museumConstants';
import { museumConfig } from '@/config/museumThemes';

export type ThemeName = typeof MUSEUM_THEMES[keyof typeof MUSEUM_THEMES];

export interface ThemeAssets {
  models: string[];
  textures: string[];
  materials: Record<string, any>;
}

export class ThemeService {
  private static currentTheme: ThemeName = MUSEUM_THEMES.CLASSIC;
  private static themeChangeListeners: Array<(theme: ThemeName) => void> = [];

  static getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  static setTheme(themeName: ThemeName): boolean {
    if (!(Object.values(MUSEUM_THEMES) as string[]).includes(themeName)) {
      return false;
    }

    this.currentTheme = themeName;
    
    this.themeChangeListeners.forEach(listener => {
      try {
        listener(themeName);
      } catch (error) {
        // Theme change listener error - continue silently
      }
    });

    return true;
  }

  static getThemeConfig(themeName?: ThemeName) {
    const theme = themeName || this.currentTheme;
    return museumConfig[theme];
  }

  static getThemeColors(themeName?: ThemeName) {
    const config = this.getThemeConfig(themeName);
    return {
      primary: new Color(config.room.wallColor),
      secondary: new Color(config.room.floorColor),
      accent: new Color(config.frame.defaultColor),
      background: new Color(config.room.ceilingColor),
    };
  }

  static getThemeAssets(themeName?: ThemeName): ThemeAssets {
    const theme = themeName || this.currentTheme;
    
    switch (theme) {
      case MUSEUM_THEMES.CLASSIC:
        return {
          models: [
            ASSET_PATHS.MODELS.CLASSICAL.DRAPED_WOMAN,
            ASSET_PATHS.MODELS.CLASSICAL.FALLEN_ANGEL,
            ASSET_PATHS.MODELS.CLASSICAL.GREEK_COLUMN,
            ASSET_PATHS.MODELS.CLASSICAL.HEBE_STATUE,
          ],
          textures: [
            ASSET_PATHS.TEXTURES.CLASSICAL.MARBLE_FLOOR_2K,
            ASSET_PATHS.TEXTURES.CLASSICAL.WHITE_PLASTER,
            ASSET_PATHS.TEXTURES.CLASSICAL.BEIGE_WALL,
          ],
          materials: {},
        };

      case MUSEUM_THEMES.MODERN:
        return {
          models: [
            ASSET_PATHS.MODELS.MODERN.GRAY_SOFA,
            ASSET_PATHS.MODELS.MODERN.FURNITURE_SET,
          ],
          textures: [
            ASSET_PATHS.TEXTURES.MODERN.CONCRETE_FLOOR,
            ASSET_PATHS.TEXTURES.MODERN.WOOD_FLOOR,
          ],
          materials: {},
        };

      case MUSEUM_THEMES.FUTURISTIC:
        return {
          models: [
            ASSET_PATHS.MODELS.FUTURISTIC.REDDISH_SOFA,
          ],
          textures: [
            ASSET_PATHS.TEXTURES.CYBER.GRANITE_TILE,
          ],
          materials: {},
        };

      case MUSEUM_THEMES.NATURE:
        return {
          models: [
            ASSET_PATHS.MODELS.NATURE.FICUS_BONSAI,
            ASSET_PATHS.MODELS.NATURE.POTTED_PLANT,
          ],
          textures: [
            ASSET_PATHS.TEXTURES.NATURE.SPARSE_GRASS,
          ],
          materials: {},
        };

      default:
        return { models: [], textures: [], materials: {} };
    }
  }

  static getLightingConfig() {
    return UNIFIED_LIGHTING;
  }

  static getEnvironmentPreset(themeName?: ThemeName): string {
    const theme = themeName || this.currentTheme;
    const config = this.getThemeConfig(theme);
    return config.atmosphere.environment || 'studio';
  }

  static onThemeChange(callback: (theme: ThemeName) => void): () => void {
    this.themeChangeListeners.push(callback);
    
    return () => {
      const index = this.themeChangeListeners.indexOf(callback);
      if (index > -1) {
        this.themeChangeListeners.splice(index, 1);
      }
    };
  }

  static getAllThemes(): ThemeName[] {
    return Object.values(MUSEUM_THEMES) as ThemeName[];
  }

  static isValidTheme(theme: string): theme is ThemeName {
    return (Object.values(MUSEUM_THEMES) as string[]).includes(theme);
  }

  static getThemeDisplayName(themeName: ThemeName): string {
    const config = this.getThemeConfig(themeName);
    return config.name || themeName;
  }

  static getThemeDescription(themeName: ThemeName): string {
    const config = this.getThemeConfig(themeName);
    return config.description || '';
  }

  static preloadThemeAssets(themeName: ThemeName): Promise<void> {
    const assets = this.getThemeAssets(themeName);
    const allAssets = [...assets.models, ...assets.textures];
    
    return Promise.resolve();
  }

  static cleanup(): void {
    this.themeChangeListeners = [];
  }
}
