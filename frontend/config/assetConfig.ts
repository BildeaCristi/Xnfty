// 3D Asset Paths Configuration
export const ASSET_PATHS = {
  MODELS: {
    CLASSICAL: {
      DRAPED_WOMAN: '/models/classical-theme/slanke_met_lang_kleed_gedrapeerde_jonge_vrouw.glb',
      FALLEN_ANGEL: '/models/classical-theme/the_fallen_angel_alexandre_cabanel.glb',
      GREEK_COLUMN: '/models/classical-theme/greek_underwater_column_5.glb',
      HEBE_STATUE: '/models/classical-theme/hebe_goddess_of_youth/scene.gltf',
    },
    MODERN: {
      GRAY_SOFA: '/models/modern-theme/modern_gray_sofa__3d_model.glb',
      FURNITURE_SET: '/models/modern-theme/furniture__no-20.glb',
    },
    FUTURISTIC: {
      REDDISH_SOFA: '/models/cyber-theme/futuristic_reddish_sofa.glb',
    },
    NATURE: {
      FICUS_BONSAI: '/models/garden-theme/ficus_bonsai/scene.gltf',
      POTTED_PLANT: '/models/garden-theme/potted_plant/scene.gltf',
    },
    COMMON: {
      CEILING_LAMP: '/models/common/luminaria_ceiling_lamp.glb',
      MODERN_LANTERN: '/models/common/modern_lantern.glb',
    },
  },
  TEXTURES: {
    CLASSICAL: {
      MARBLE_FLOOR_2K: '/textures/classical-theme/marble_floor_2k.jpg',
      MARBLE_FLOOR_4K: '/textures/classical-theme/marble_floor_4k.jpg',
      WHITE_PLASTER: '/textures/classical-theme/white_plaster_02_2k.blend/textures/white_plaster_02_diff_2k.jpg',
      BEIGE_WALL: '/textures/classical-theme/beige_wall_001_2k.blend/textures/beige_wall_001_diff_2k.jpg',
    },
    MODERN: {
      CONCRETE_FLOOR: '/textures/modern-theme/concrete_floor_painted_2k.blend/textures/concrete_floor_painted_diff_2k.jpg',
      CONCRETE_NORMAL: '/textures/modern-theme/concrete_floor_painted_2k.blend/textures/concrete_floor_painted_nor_gl_2k.exr',
      CONCRETE_ROUGH: '/textures/modern-theme/concrete_floor_painted_2k.blend/textures/concrete_floor_painted_rough_2k.jpg',
      WOOD_FLOOR: '/textures/modern-theme/wood_floor_2k.blend/textures/wood_floor_diff_2k.jpg',
      WOOD_NORMAL: '/textures/modern-theme/wood_floor_2k.blend/textures/wood_floor_nor_gl_2k.exr',
      WOOD_ROUGH: '/textures/modern-theme/wood_floor_2k.blend/textures/wood_floor_rough_2k.exr',
    },
    CYBER: {
      GRANITE_TILE: '/textures/cyber-theme/granite_tile_2k.blend/textures/granite_tile_diff_2k.jpg',
      GRANITE_NORMAL: '/textures/cyber-theme/granite_tile_2k.blend/textures/granite_tile_nor_gl_2k.exr',
      GRANITE_ROUGH: '/textures/cyber-theme/granite_tile_2k.blend/textures/granite_tile_rough_2k.exr',
    },
    NATURE: {
      SPARSE_GRASS: '/textures/garden-theme/sparse_grass_2k.blend/textures/sparse_grass_diff_2k.jpg',
      SPARSE_GRASS_NORMAL: '/textures/garden-theme/sparse_grass_2k.blend/textures/sparse_grass_nor_gl_2k.exr',
      SPARSE_GRASS_ROUGH: '/textures/garden-theme/sparse_grass_2k.blend/textures/sparse_grass_rough_2k.exr',
    },
  },
  SOUNDS: {
    AMBIENT_JAZZ: '/sounds/jazz.mp3',
  },
} as const;

// Asset Loading Configuration
export const ASSET_LOADING_CONFIG = {
  TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  CONCURRENT_LOADS: 4,
  PRELOAD_PRIORITY: {
    ESSENTIAL: 1,
    IMPORTANT: 2,
    NICE_TO_HAVE: 3,
  },
} as const;

// Asset Quality Settings
export const ASSET_QUALITY_SETTINGS = {
  LOW: {
    textureSize: '2k',
    modelLOD: 'low',
    enableNormalMaps: false,
    enableRoughnessMaps: false,
  },
  MEDIUM: {
    textureSize: '2k',
    modelLOD: 'medium',
    enableNormalMaps: true,
    enableRoughnessMaps: false,
  },
  HIGH: {
    textureSize: '4k',
    modelLOD: 'high',
    enableNormalMaps: true,
    enableRoughnessMaps: true,
  },
} as const;

// Model Scaling and Positioning Presets
export const MODEL_PRESETS = {
  CLASSICAL_SCULPTURE: {
    scale: 0.8,
    baseHeight: 0.1,
  },
  MODERN_FURNITURE: {
    scale: 1.0,
    baseHeight: 0.1,
  },
  COLUMN: {
    scale: 1.5,
    baseHeight: 0.1,
  },
  PLANT: {
    scale: 1.0,
    baseHeight: 0.05,
  },
} as const;

export type AssetPath = typeof ASSET_PATHS;
export type QualityLevel = keyof typeof ASSET_QUALITY_SETTINGS;
export type ModelPreset = keyof typeof MODEL_PRESETS;
