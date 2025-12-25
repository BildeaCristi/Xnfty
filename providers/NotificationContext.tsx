'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  AlertCircle,
  HelpCircle 
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmationPromise, setConfirmationPromise] = useState<{
    resolve: (value: boolean) => void;
    options: ConfirmationOptions;
  } | null>(null);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    showNotification({ type: 'error', title, message, duration: 8000 });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification({ type: 'warning', title, message, duration: 6000 });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationPromise({ resolve, options });
    });
  }, []);

  const handleConfirmationResponse = useCallback((response: boolean) => {
    if (confirmationPromise) {
      confirmationPromise.resolve(response);
      setConfirmationPromise(null);
    }
  }, [confirmationPromise]);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
      {confirmationPromise && (
        <ConfirmationModal
          options={confirmationPromise.options}
          onConfirm={() => handleConfirmationResponse(true)}
          onCancel={() => handleConfirmationResponse(false)}
        />
      )}
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/90 border-green-400/50 text-white shadow-green-500/20';
      case 'error':
        return 'bg-red-500/90 border-red-400/50 text-white shadow-red-500/20';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400/50 text-white shadow-yellow-500/20';
      case 'info':
        return 'bg-blue-500/90 border-blue-400/50 text-white shadow-blue-500/20';
      default:
        return 'bg-gray-500/90 border-gray-400/50 text-white shadow-gray-500/20';
    }
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5", strokeWidth: 2 };
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div
      className={`
        ${getNotificationStyles()}
        border rounded-xl shadow-2xl p-4 min-w-0 max-w-sm
        transform transition-all duration-500 ease-out
        animate-in slide-in-from-right-full fade-in
        backdrop-blur-md
        hover:scale-105 hover:shadow-xl
        group
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1 leading-relaxed">{notification.message}</p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm font-medium underline hover:no-underline mt-2 transition-all duration-200 hover:opacity-80"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-200 hover:bg-white/20 rounded-full p-1 -m-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

interface ConfirmationModalProps {
  options: ConfirmationOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  options,
  onConfirm,
  onCancel,
}) => {
  const getModalStyles = () => {
    switch (options.type) {
      case 'danger':
        return 'border-red-500/30 bg-red-950/30';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-950/30';
      case 'info':
        return 'border-blue-500/30 bg-blue-950/30';
      default:
        return 'border-gray-500/30 bg-gray-950/50';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (options.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-red-500/25';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white shadow-yellow-500/25';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-blue-500/25';
      default:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-gray-500/25';
    }
  };

  const getIcon = () => {
    const iconProps = { className: "w-6 h-6", strokeWidth: 2 };
    
    switch (options.type) {
      case 'danger':
        return <AlertCircle {...iconProps} className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-6 h-6 text-yellow-400" />;
      case 'info':
        return <Info {...iconProps} className="w-6 h-6 text-blue-400" />;
      default:
        return <HelpCircle {...iconProps} className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`
          bg-gray-900/95 rounded-2xl shadow-2xl w-full max-w-md border backdrop-blur-md
          ${getModalStyles()}
          animate-in fade-in zoom-in-95 duration-300
        `}
      >
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            {getIcon()}
            <h2 className="text-xl font-bold text-white leading-tight">{options.title}</h2>
          </div>
          
          <p className="text-gray-300 mb-8 leading-relaxed text-sm">
            {options.message}
          </p>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {options.cancelText || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className={`
                px-6 py-2.5 rounded-lg transition-all duration-200 font-medium
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg
                ${getConfirmButtonStyles()}
              `}
            >
              {options.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 