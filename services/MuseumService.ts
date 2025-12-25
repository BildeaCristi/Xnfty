import {MUSEUM_DIMENSIONS, NFT_POSITIONING} from '@/utils/constants/museumConstants';

export class MuseumService {
    static calculateNFTPositions(total: number): [number, number, number][] {
        const positions: [number, number, number][] = [];
        const {WALL_SPACING, NFT_HEIGHT, WALLS_COUNT} = NFT_POSITIONING;
        const {ROOM_SIZE, WALL_OFFSET} = MUSEUM_DIMENSIONS;

        const perWall = Math.ceil(total / WALLS_COUNT);

        for (let i = 0; i < total; i++) {
            const wall = Math.floor(i / perWall);
            const positionOnWall = i % perWall;

            const totalWidth = (perWall - 1) * WALL_SPACING;
            const startOffset = -totalWidth / 2;
            const offset = startOffset + positionOnWall * WALL_SPACING;

            switch (wall) {
                case 0: // Front wall
                    positions.push([offset, NFT_HEIGHT, -(ROOM_SIZE - WALL_OFFSET)]);
                    break;
                case 1: // Right wall
                    positions.push([ROOM_SIZE - WALL_OFFSET, NFT_HEIGHT, offset]);
                    break;
                case 2: // Back wall
                    positions.push([-offset, NFT_HEIGHT, ROOM_SIZE - WALL_OFFSET]);
                    break;
                case 3: // Left wall
                    positions.push([-(ROOM_SIZE - WALL_OFFSET), NFT_HEIGHT, -offset]);
                    break;
                default:
                    positions.push([0, NFT_HEIGHT, 0]);
            }
        }

        return positions;
    }

    static calculateNFTRotation(index: number, total: number): [number, number, number] {
        const {WALLS_COUNT} = NFT_POSITIONING;
        const perWall = Math.ceil(total / WALLS_COUNT);
        const wall = Math.floor(index / perWall);

        const rotations: [number, number, number][] = [
            [0, 0, 0],                    // Front wall
            [0, -Math.PI / 2, 0],         // Right wall
            [0, Math.PI, 0],              // Back wall
            [0, Math.PI / 2, 0],          // Left wall
        ];

        return rotations[wall] || [0, 0, 0];
    }
} 