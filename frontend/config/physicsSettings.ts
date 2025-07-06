// Physics World Configuration
export const PHYSICS_WORLD_CONFIG = {
    DEFAULT_GRAVITY: [0, -9.81, 0] as [number, number, number],
    DEFAULT_TIME_STEP: 1 / 60,
    UPDATE_PRIORITY: -50,
    INTERPOLATE: true,
    COLLIDERS_AUTO: false,
} as const;

// Physics Material Properties
export const PHYSICS_MATERIALS = {
    MUSEUM_FLOOR: {
        friction: 0.7,
        restitution: 0.1,
        density: 1.0,
    },
    MUSEUM_WALLS: {
        friction: 0.8,
        restitution: 0.05,
        density: 2.0,
    },
    NFT_FRAME: {
        friction: 0.6,
        restitution: 0.2,
        density: 0.8,
    },
    SCULPTURE: {
        friction: 0.9,
        restitution: 0.1,
        density: 3.0,
    },
    FURNITURE: {
        friction: 0.6,
        restitution: 0.3,
        density: 1.2,
    },
} as const;

// Physics Object Presets
export const PHYSICS_PRESETS = {
    STATIC: {
        type: "fixed" as const,
        friction: 0.7,
        restitution: 0.1,
    },
    INTERACTIVE: {
        type: "dynamic" as const,
        mass: 1,
        friction: 0.5,
        restitution: 0.3,
        linearDamping: 0.5,
        angularDamping: 0.5,
        ccd: true,
    },
    FLOATING: {
        type: "dynamic" as const,
        mass: 0.5,
        gravityScale: -0.1,
        linearDamping: 2,
        angularDamping: 1,
        friction: 0.1,
    },
    HEAVY: {
        type: "dynamic" as const,
        mass: 10,
        friction: 0.8,
        restitution: 0.1,
        linearDamping: 0.8,
        angularDamping: 0.8,
    },
    CHARACTER: {
        type: "kinematicPosition" as const,
        enabledRotations: [false, true, false] as [boolean, boolean, boolean],
        friction: 0,
        restitution: 0,
        ccd: true,
    },
} as const;

export type PhysicsPresetType = keyof typeof PHYSICS_PRESETS;
export type PhysicsMaterialType = keyof typeof PHYSICS_MATERIALS;
