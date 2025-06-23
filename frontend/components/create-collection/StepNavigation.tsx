'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    canGoBack: boolean;
    canGoNext: boolean;
    onBack: () => void;
    onNext: () => void;
    isDeploying?: boolean;
}

const stepLabels = [
    'Collection Details',
    'Add NFTs',
    'Deploy'
];

export default function StepNavigation({
    currentStep,
    totalSteps,
    canGoBack,
    canGoNext,
    onBack,
    onNext,
    isDeploying = false
}: StepNavigationProps) {
    return (
        <div className="flex items-center justify-between">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    {Array.from({ length: totalSteps }, (_, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isCompleted = stepNumber < currentStep;
                        
                        return (
                            <div key={stepNumber} className="flex items-center">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                        ${isActive 
                                            ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 ring-offset-gray-900' 
                                            : isCompleted 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-gray-700 text-gray-400'
                                        }
                                    `}
                                >
                                    {isCompleted ? '✓' : stepNumber}
                                </div>
                                {index < totalSteps - 1 && (
                                    <div 
                                        className={`
                                            w-16 h-0.5 mx-3 transition-colors
                                            ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}
                                        `} 
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Step Label */}
                <div className="ml-2">
                    <p className="text-sm text-gray-400">
                        Step {currentStep} of {totalSteps}
                    </p>
                    <p className="text-white font-medium">
                        {stepLabels[currentStep - 1]}
                    </p>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3">
                {canGoBack && (
                    <button
                        onClick={onBack}
                        disabled={isDeploying}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                )}
                
                {canGoNext && currentStep < totalSteps && (
                    <button
                        onClick={onNext}
                        disabled={isDeploying}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
} 