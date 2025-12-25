"use client";

import {ReactNode, useEffect, useRef} from "react";

interface GlassModalProps {
    children: ReactNode;
}

export default function LoginGlassModal({children}: GlassModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!modalRef.current) return;

            const x = (e.clientX / globalThis.innerWidth - 0.5) * 8;
            const y = (e.clientY / globalThis.innerHeight - 0.5) * 8;

            modalRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(10px)`;
        };

        globalThis.addEventListener('mousemove', handleMouseMove);
        return () => globalThis.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={modalRef}
            className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 dark:from-black/20 dark:to-purple-900/10
        rounded-2xl p-10 shadow-[0_0_15px_rgba(101,31,255,0.4)] border border-white/10
        transition-all duration-200 hover:shadow-[0_0_20px_rgba(101,31,255,0.6)]
        w-[95%] max-w-2xl mx-auto"
        >
            <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-50 pointer-events-none"></div>
            <div
                className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-400/20 via-transparent to-purple-600/20 pointer-events-none"></div>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                    Welcome to Xnfty
                </h1>
                <p className="text-cyan-100/80 text-lg mb-6">
                    The ultimate 3D marketplace for next-generation digital NFTs
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto rounded-full"></div>
            </div>

            <div className="mt-8 text-center text-md text-black-100/60">
                <p>Connect your wallet or connect with Google as guest to start exploring the future of digital
                    ownership</p>
            </div>

            {children}
        </div>
    );
}