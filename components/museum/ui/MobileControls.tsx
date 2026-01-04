"use client";

import {useCallback, useRef, useState} from 'react';
import type {PointerEvent, RefObject} from 'react';

interface Vector2 {
    x: number;
    y: number;
}

interface MobileControlsProps {
    onMove: (vector: Vector2) => void;
    onLook: (vector: Vector2) => void;
    onJumpStart: () => void;
    onJumpEnd: () => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}

const JOYSTICK_RADIUS = 48;

function clampVector(dx: number, dy: number, radius: number) {
    const distance = Math.min(radius, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
    };
}

export default function MobileControls({
                                          onMove,
                                          onLook,
                                          onJumpStart,
                                          onJumpEnd,
                                          onInteractStart,
                                          onInteractEnd,
                                      }: MobileControlsProps) {
    const moveBaseRef = useRef<HTMLDivElement | null>(null);
    const lookBaseRef = useRef<HTMLDivElement | null>(null);

    const [moveKnob, setMoveKnob] = useState<Vector2>({x: 0, y: 0});
    const [lookKnob, setLookKnob] = useState<Vector2>({x: 0, y: 0});

    const movePointerId = useRef<number | null>(null);
    const lookPointerId = useRef<number | null>(null);

    const updateJoystick = useCallback((
        event: PointerEvent<HTMLDivElement>,
        baseRef: RefObject<HTMLDivElement | null>,
        setKnob: (vector: Vector2) => void,
        onVector: (vector: Vector2) => void,
    ) => {
        const base = baseRef.current;
        if (!base) return;

        const rect = base.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const clamped = clampVector(dx, dy, JOYSTICK_RADIUS);

        setKnob(clamped);
        onVector({
            x: clamped.x / JOYSTICK_RADIUS,
            y: -clamped.y / JOYSTICK_RADIUS,
        });
    }, []);

    const resetJoystick = useCallback((setKnob: (vector: Vector2) => void, onVector: (vector: Vector2) => void) => {
        setKnob({x: 0, y: 0});
        onVector({x: 0, y: 0});
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none select-none z-20">
            <div className="absolute bottom-6 left-6 pointer-events-auto">
                <div
                    ref={moveBaseRef}
                    className="relative w-28 h-28 rounded-full bg-white/10 border border-white/20 touch-none"
                    onPointerDown={(event) => {
                        movePointerId.current = event.pointerId;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        updateJoystick(event, moveBaseRef, setMoveKnob, onMove);
                    }}
                    onPointerMove={(event) => {
                        if (movePointerId.current !== event.pointerId) return;
                        updateJoystick(event, moveBaseRef, setMoveKnob, onMove);
                    }}
                    onPointerUp={(event) => {
                        if (movePointerId.current !== event.pointerId) return;
                        movePointerId.current = null;
                        event.currentTarget.releasePointerCapture(event.pointerId);
                        resetJoystick(setMoveKnob, onMove);
                    }}
                    onPointerCancel={(event) => {
                        if (movePointerId.current !== event.pointerId) return;
                        movePointerId.current = null;
                        resetJoystick(setMoveKnob, onMove);
                    }}
                >
                    <div
                        className="absolute w-12 h-12 rounded-full bg-white/40 border border-white/70"
                        style={{
                            transform: `translate(${moveKnob.x + JOYSTICK_RADIUS}px, ${moveKnob.y + JOYSTICK_RADIUS}px)`,
                        }}
                    />
                </div>
                <p className="mt-2 text-xs text-white/70 text-center">Move</p>
            </div>

            <div className="absolute bottom-6 right-6 pointer-events-auto">
                <div
                    ref={lookBaseRef}
                    className="relative w-28 h-28 rounded-full bg-white/10 border border-white/20 touch-none"
                    onPointerDown={(event) => {
                        lookPointerId.current = event.pointerId;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        updateJoystick(event, lookBaseRef, setLookKnob, onLook);
                    }}
                    onPointerMove={(event) => {
                        if (lookPointerId.current !== event.pointerId) return;
                        updateJoystick(event, lookBaseRef, setLookKnob, onLook);
                    }}
                    onPointerUp={(event) => {
                        if (lookPointerId.current !== event.pointerId) return;
                        lookPointerId.current = null;
                        event.currentTarget.releasePointerCapture(event.pointerId);
                        resetJoystick(setLookKnob, onLook);
                    }}
                    onPointerCancel={(event) => {
                        if (lookPointerId.current !== event.pointerId) return;
                        lookPointerId.current = null;
                        resetJoystick(setLookKnob, onLook);
                    }}
                >
                    <div
                        className="absolute w-12 h-12 rounded-full bg-white/40 border border-white/70"
                        style={{
                            transform: `translate(${lookKnob.x + JOYSTICK_RADIUS}px, ${lookKnob.y + JOYSTICK_RADIUS}px)`,
                        }}
                    />
                </div>
                <p className="mt-2 text-xs text-white/70 text-center">Look</p>
            </div>

            <div className="absolute bottom-28 right-36 flex flex-col gap-3 pointer-events-auto">
                <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-blue-500/80 text-white text-sm font-semibold shadow-lg"
                    onPointerDown={onJumpStart}
                    onPointerUp={onJumpEnd}
                    onPointerLeave={onJumpEnd}
                >
                    Jump
                </button>
                <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-purple-500/80 text-white text-sm font-semibold shadow-lg"
                    onPointerDown={onInteractStart}
                    onPointerUp={onInteractEnd}
                    onPointerLeave={onInteractEnd}
                >
                    Interact
                </button>
            </div>
        </div>
    );
}
