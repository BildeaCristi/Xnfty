'use client';

import React from 'react';
import {X} from 'lucide-react';

interface ModalHeaderProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    isDeploying?: boolean;
}

export default function ModalHeader({
                                        title,
                                        subtitle,
                                        onClose,
                                        isDeploying = false
                                    }: ModalHeaderProps) {
    return (
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                {subtitle && (
                    <p className="text-gray-400 mt-1">{subtitle}</p>
                )}
            </div>
            <button
                onClick={onClose}
                disabled={isDeploying}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
            >
                <X className="w-6 h-6 text-gray-400 hover:text-white"/>
            </button>
        </div>
    );
} 