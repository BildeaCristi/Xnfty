'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
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
    showNotification({ type: 'error', title, message, duration: 7000 });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification({ type: 'warning', title, message });
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

// Notification Container Component
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
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

// Individual Notification Item
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-white';
      case 'error':
        return 'bg-red-600 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600 border-yellow-500 text-white';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-white';
      default:
        return 'bg-gray-600 border-gray-500 text-white';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div
      className={`
        ${getNotificationStyles()}
        border rounded-lg shadow-lg p-4 min-w-0 max-w-sm
        transform transition-all duration-300 ease-in-out
        animate-slide-in-right backdrop-blur-sm
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-lg font-bold">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm underline hover:no-underline mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
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
        return 'border-red-500/50 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-900/20';
      case 'info':
        return 'border-blue-500/50 bg-blue-900/20';
      default:
        return 'border-gray-500/50 bg-gray-900/50';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (options.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getIcon = () => {
    switch (options.type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border ${getModalStyles()}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{getIcon()}</span>
            <h2 className="text-xl font-bold text-white">{options.title}</h2>
          </div>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {options.message}
          </p>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {options.cancelText || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors ${getConfirmButtonStyles()}`}
            >
              {options.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 