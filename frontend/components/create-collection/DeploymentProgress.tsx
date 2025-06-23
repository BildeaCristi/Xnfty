'use client';

import React from 'react';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import type { DeploymentStep } from '@/types/forms';

interface DeploymentProgressProps {
    steps: DeploymentStep[];
    isDeploying: boolean;
}

export default function DeploymentProgress({ steps, isDeploying }: DeploymentProgressProps) {
    const getStepIcon = (status: DeploymentStep['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            case 'processing':
                return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
            case 'pending':
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStepStatusColor = (status: DeploymentStep['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            case 'processing':
                return 'text-blue-400';
            case 'pending':
            default:
                return 'text-gray-400';
        }
    };

    const getProgressPercentage = () => {
        if (steps.length === 0) return 0;
        const completedSteps = steps.filter(step => step.status === 'completed').length;
        return (completedSteps / steps.length) * 100;
    };

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Deployment Progress</span>
                    <span className="text-gray-400 text-sm">
                        {steps.filter(s => s.status === 'completed').length} / {steps.length} completed
                    </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            </div>

            {/* Deployment Steps */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                            {getStepIcon(step.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${getStepStatusColor(step.status)}`}>
                                    {step.name}
                                </h4>
                                <span className="text-xs text-gray-500">
                                    Step {index + 1}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1 break-words">
                                {step.description}
                            </p>
                            {step.status === 'processing' && (
                                <div className="mt-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-blue-400 text-xs">Processing...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Message */}
            {isDeploying && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <div>
                            <p className="text-blue-400 font-medium">Deployment in Progress</p>
                            <p className="text-gray-400 text-sm">
                                Please do not close this window. This process may take several minutes.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Completion Message */}
            {!isDeploying && steps.length > 0 && steps.every(s => s.status === 'completed') && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-green-400 font-medium">Deployment Completed Successfully</p>
                            <p className="text-gray-400 text-sm">
                                Your collection and NFTs have been deployed to the blockchain.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {!isDeploying && steps.some(s => s.status === 'error') && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <div>
                            <p className="text-red-400 font-medium">Deployment Failed</p>
                            <p className="text-gray-400 text-sm">
                                Some steps failed during deployment. Please check the errors above.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 