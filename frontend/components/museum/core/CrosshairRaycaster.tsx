"use client";

import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {NFT} from '@/types/blockchain';
import * as THREE from 'three';

interface CrosshairRaycasterProps {
    enabled: boolean;
    onHoverNFT: (tokenId: number | null) => void;
    onClickNFT: (nft: NFT | null) => void;
    nfts: NFT[];
    interactionMode: boolean;
}

export default function CrosshairRaycaster({
                                               enabled,
                                               onHoverNFT,
                                               onClickNFT,
                                               nfts,
                                               interactionMode
                                           }: CrosshairRaycasterProps) {
    const {camera, scene, gl} = useThree();
    const raycaster = useRef(new THREE.Raycaster());

    useFrame(() => {
        if (!enabled || !interactionMode) {
            onHoverNFT(null);
            return;
        }

        raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.current.intersectObjects(scene.children, true);

        let foundNFT = false;
        for (const intersect of intersects) {
            let obj = intersect.object;

            while (obj) {
                if (obj.userData?.tokenId) {
                    onHoverNFT(obj.userData.tokenId);
                    foundNFT = true;
                    break;
                }
                obj = obj.parent as THREE.Object3D;
            }

            if (foundNFT) break;
        }

        if (!foundNFT) {
            onHoverNFT(null);
        }
    });

    // Handle click events
    useEffect(() => {
        if (!enabled) return;

        const handleClick = () => {
            if (!enabled || !interactionMode) return;

            raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.current.intersectObjects(scene.children, true);

            for (const intersect of intersects) {
                let obj = intersect.object;

                while (obj) {
                    if (obj.userData?.tokenId) {
                        const nft = nfts.find(n => n.tokenId === obj.userData.tokenId);
                        onClickNFT(nft || null);
                        return;
                    }
                    obj = obj.parent as THREE.Object3D;
                }
            }

            onClickNFT(null);
        };

        const canvas = gl.domElement;
        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('click', handleClick);
        };
    }, [enabled, camera, scene, gl, onClickNFT, nfts, interactionMode]);

    return null;
} 