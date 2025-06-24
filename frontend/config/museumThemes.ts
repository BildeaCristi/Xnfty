export interface MuseumTheme {
    name: string;
    description: string;
    room: {
        wallColor: string;
        floorColor: string;
        ceilingColor: string;
        wallRoughness: number;
        wallMetalness: number;
        floorRoughness: number;
        floorMetalness: number;
    };
    frame: {
        defaultColor: string;
        hoverColor: string;
        metalness: number;
        roughness: number;
    };
    atmosphere: {
        fog?: {
            color: string;
            near: number;
            far: number;
        };
        environment?: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'park' | 'lobby';
    };
}

export const museumThemes: Record<string, MuseumTheme> = {
    modern: {
        name: 'Modern Gallery',
        description: 'Clean, minimalist design with bright lighting',
        room: {
            wallColor: '#ffffff',
            floorColor: '#f0f0f0',
            ceilingColor: '#ffffff',
            wallRoughness: 0.9,
            wallMetalness: 0.1,
            floorRoughness: 0.2,
            floorMetalness: 0.8,
        },

        frame: {
            defaultColor: '#1a1a1a',
            hoverColor: '#4a90e2',
            metalness: 0.9,
            roughness: 0.1,
        },
        atmosphere: {
            environment: 'studio',
        },
    },
    classic: {
        name: 'Classic Museum',
        description: 'Traditional museum with warm, sophisticated ambiance',
        room: {
            wallColor: '#d4c5b9',
            floorColor: '#8b6f47',
            ceilingColor: '#f5f5dc',
            wallRoughness: 0.8,
            wallMetalness: 0.1,
            floorRoughness: 0.9,
            floorMetalness: 0.1,
        },

        frame: {
            defaultColor: '#8b4513',
            hoverColor: '#daa520',
            metalness: 0.7,
            roughness: 0.3,
        },
        atmosphere: {
            environment: 'apartment',
            fog: {
                color: '#d4c5b9',
                near: 10,
                far: 30,
            },
        },
    },
    futuristic: {
        name: 'Cyber Gallery',
        description: 'Neon-lit futuristic space with high-tech vibes',
        room: {
            wallColor: '#0a0a0a',
            floorColor: '#1a1a1a',
            ceilingColor: '#000000',
            wallRoughness: 0.1,
            wallMetalness: 0.9,
            floorRoughness: 0.1,
            floorMetalness: 0.9,
        },

        frame: {
            defaultColor: '#1e90ff',
            hoverColor: '#ff1493',
            metalness: 1,
            roughness: 0,
        },
        atmosphere: {
            environment: 'night',
            fog: {
                color: '#000033',
                near: 5,
                far: 25,
            },
        },
    },
    nature: {
        name: 'Garden Gallery',
        description: 'Outdoor-inspired space with natural lighting',
        room: {
            wallColor: '#f5deb3',
            floorColor: '#8fbc8f',
            ceilingColor: '#87ceeb',
            wallRoughness: 0.9,
            wallMetalness: 0,
            floorRoughness: 1,
            floorMetalness: 0,
        },

        frame: {
            defaultColor: '#8b4513',
            hoverColor: '#228b22',
            metalness: 0.2,
            roughness: 0.8,
        },
        atmosphere: {
            environment: 'park',
        },
    },
}; 