export const MUSEUM_THEMES = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  FUTURISTIC: 'futuristic',
  NATURE: 'nature',
} as const;

export const CONTROL_MODES = {
  ORBIT: 'orbit',
  FIRST_PERSON: 'firstPerson',
} as const;

export const QUALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const MUSEUM_DIMENSIONS = {
  ROOM_SIZE: 10,
  ROOM_HEIGHT: 6,
  CEILING_HEIGHT: 5.5,
  WALL_OFFSET: 0.2,
} as const;

export const NFT_POSITIONING = {
  WALL_SPACING: 3.5,
  NFT_HEIGHT: 2,
  WALLS_COUNT: 4,
} as const;

export const CAMERA_SETTINGS = {
  DEFAULT_POSITION: [0, 2, 8] as [number, number, number],
  FOV: 60,
  NEAR: 0.1,
  FAR: 100,
} as const;

export const PERFORMANCE_SETTINGS = {
  DEFAULT_DPR: 1.5,
  MAX_DPR: 2,
  MIN_DPR: 1,
  PERFORMANCE_FLIPFLOPS: 3,
} as const;

export const MODAL_SETTINGS = {
  CLOSE_COOLDOWN: 300,
  IMAGE_LOAD_TIMEOUT: 5000,
  IMAGE_LOAD_DELAY: 500,
} as const;

export const KEYBOARD_CONTROLS = {
  TOGGLE_CONTROL: ['c', 'C'] as readonly string[],
  TOGGLE_SETTINGS: 'Escape',
  INTERACTION: ['e', 'E'] as readonly string[],
} as const;

export const LIGHTING_CONFIG = {
  MAX_LIGHTS: 3,
  AMBIENT_BASE: 0.4,
  DIRECTIONAL_BASE: 1.0,
  RECT_AREA_BASE_INTENSITY: 2.5,
  QUALITY_MULTIPLIERS: {
    low: 1.2,
    medium: 1.0,
    high: 0.9,
  },
} as const;

export type MuseumTheme = keyof typeof MUSEUM_THEMES;
export type ControlMode = keyof typeof CONTROL_MODES;
export type QualityLevel = keyof typeof QUALITY_LEVELS; 