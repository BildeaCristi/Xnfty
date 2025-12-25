'use client';

import {DASHBOARD_MESSAGES} from '@/utils/constants/dashboard';

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export default function LoadingState({
                                         message = DASHBOARD_MESSAGES.LOADING,
                                         className = "text-center py-12"
                                     }: LoadingStateProps) {
    return (
        <div className={className}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-blue-200 mt-4">{message}</p>
        </div>
    );
} 