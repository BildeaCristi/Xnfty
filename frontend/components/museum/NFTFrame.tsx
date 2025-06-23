"use client";

import {useRef, useState, useEffect, useMemo} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {Text, Html} from '@react-three/drei';
import * as THREE from 'three';
import {NFT} from '@/types/blockchain';
import TextureManagerService from '@/services/TextureManagerService';

interface NFTFrameProps {
    nft: NFT;
    position: [number, number, number];
    rotation: [number, number, number];
    onClick: () => void;
    onPointerOver: () => void;
    onPointerOut: () => void;
    isHovered: boolean;
}

export default function NFTFrame({
    nft,
    position,
    rotation,
    onClick,
    onPointerOver,
    onPointerOut,
    isHovered
}: NFTFrameProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [loading, setLoading] = useState(true);
    const textureManager = TextureManagerService.getInstance();
    
    // Convert IPFS URL to HTTP gateway URL
    const getImageUrl = (uri: string | undefined): string => {
        if (!uri) return '';

        // Handle IPFS URLs
        if (uri.includes('ipfs://')) {
            const hash = uri.replace('ipfs://', '');
            return `https://gateway.pinata.cloud/ipfs/${hash}`;
        }
        
        // If it's already a gateway URL or HTTP URL, use it directly
        return uri;
    };

    const imageUrl = getImageUrl(nft.imageURI);
    
    // Create fallback texture only once
    const fallbackTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; // Reduced size to save memory
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#2d2d2d');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text
            ctx.fillStyle = '#666666';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('NFT', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Arial';
            ctx.fillText(`#${nft.tokenId}`, canvas.width / 2, canvas.height / 2 + 30);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false; // Save GPU memory
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }, [nft.tokenId]);
    
    // Load texture using TextureManagerService
    useEffect(() => {
        let isMounted = true;
        let loadedUrl: string | null = null;
        
        const loadTexture = async () => {
            if (!imageUrl) {
                setTexture(fallbackTexture);
                setLoading(false);
                return;
            }
            
            try {
                const loadedTexture = await textureManager.loadTexture(imageUrl);
                
                if (isMounted) {
                    setTexture(loadedTexture);
                    setLoading(false);
                    loadedUrl = imageUrl;
                }
            } catch (error) {
                console.error('Failed to load image:', imageUrl, error);
                if (isMounted) {
                    setTexture(fallbackTexture);
                    setLoading(false);
                }
            }
        };
        
        loadTexture();
        
        // Cleanup
        return () => {
            isMounted = false;
            // Release texture reference
            if (loadedUrl) {
                textureManager.releaseTexture(loadedUrl);
            }
        };
    }, [imageUrl, fallbackTexture, textureManager]);
    
    // Dispose fallback texture on unmount
    useEffect(() => {
        return () => {
            fallbackTexture.dispose();
        };
    }, [fallbackTexture]);
    
    // Hover animation
    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Smooth scale animation on hover
        const targetScale = isHovered ? 1.05 : 1;
        const currentScale = meshRef.current.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
        meshRef.current.scale.setScalar(newScale);
    });

    return (
        <group 
            position={position} 
            rotation={rotation}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            userData={{ tokenId: nft.tokenId }}
        >
            {/* Frame border with detailed styling */}
            <mesh castShadow receiveShadow>
                <planeGeometry args={[2.2, 2.7]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            
            {/* White mat/border */}
            <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[2.1, 2.6]} />
                <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            
            {/* Simple NFT display panel */}
            <mesh
                ref={meshRef}
                position={[0, 0, 0.001]}
            >
                <planeGeometry args={[2, 2.5]} />
                <meshStandardMaterial 
                    map={texture} 
                    color={loading ? '#333333' : 'white'}
                    transparent={false}
                />
            </mesh>
            
            {/* Simple name label on dark background */}
            <mesh position={[0, -1.4, 0.002]}>
                <planeGeometry args={[1.8, 0.25]} />
                <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            
            <Text
                position={[0, -1.4, 0.01]}
                fontSize={0.1}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {nft.name || `NFT #${nft.tokenId}`}
            </Text>
            
            {/* Hover info */}
            {isHovered && (
                <Html
                    position={[0, 1.5, 0]}
                    center
                    style={{
                        pointerEvents: 'none',
                    }}
                >
                    <div className="bg-black/90 text-white p-2 rounded text-sm whitespace-nowrap">
                        <div className="font-semibold">{nft.name || `NFT #${nft.tokenId}`}</div>
                        <div className="text-xs opacity-75">Token ID: {nft.tokenId}</div>
                        {nft.isfractionalized && (
                            <div className="text-xs text-purple-400">Fractionalized</div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
} 