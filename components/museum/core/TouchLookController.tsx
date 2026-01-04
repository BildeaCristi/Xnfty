"use client";

import {useEffect, useRef} from 'react';
import {useThree} from '@react-three/fiber';

interface TouchLookControllerProps {
    enabled: boolean;
    onLookInput: (vector: { x: number; y: number }) => void;
}

export default function TouchLookController({enabled, onLookInput}: TouchLookControllerProps) {
    const {gl} = useThree();
    const activePointerId = useRef<number | null>(null);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!enabled) {
            onLookInput({x: 0, y: 0});
        }
    }, [enabled, onLookInput]);

    useEffect(() => {
        const canvas = gl.domElement;
        const previousTouchAction = canvas.style.touchAction;
        canvas.style.touchAction = 'none';

        const handlePointerDown = (event: PointerEvent) => {
            if (!enabled) return;
            activePointerId.current = event.pointerId;
            lastPoint.current = {x: event.clientX, y: event.clientY};
            canvas.setPointerCapture(event.pointerId);
            onLookInput({x: 0, y: 0});
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (!enabled || activePointerId.current !== event.pointerId) return;
            const last = lastPoint.current;
            if (!last) return;
            const dx = event.clientX - last.x;
            const dy = event.clientY - last.y;
            lastPoint.current = {x: event.clientX, y: event.clientY};
            onLookInput({
                x: dx / 60,
                y: -dy / 60,
            });
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (activePointerId.current !== event.pointerId) return;
            activePointerId.current = null;
            lastPoint.current = null;
            canvas.releasePointerCapture(event.pointerId);
            onLookInput({x: 0, y: 0});
        };

        canvas.addEventListener('pointerdown', handlePointerDown, {passive: true});
        canvas.addEventListener('pointermove', handlePointerMove, {passive: true});
        canvas.addEventListener('pointerup', handlePointerUp, {passive: true});
        canvas.addEventListener('pointercancel', handlePointerUp, {passive: true});

        return () => {
            canvas.style.touchAction = previousTouchAction;
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [gl, enabled, onLookInput]);

    return null;
}
