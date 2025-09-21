'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApiChat } from '@/context/ApiChatContext';

interface RealtimeUpdatesProps {
  enabled?: boolean;
  interval?: number;
  className?: string;
}

export function RealtimeUpdates({ 
  enabled = true, 
  interval = 30000, // 30 seconds
  className = '' 
}: RealtimeUpdatesProps) {
  const { isAuthenticated, user } = useApiChat();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    const startPolling = () => {
      intervalRef.current = setInterval(async () => {
        if (isUpdating) return;

        setIsUpdating(true);
        try {
          // Only update if user is active (page is visible)
          if (document.visibilityState === 'visible') {
            await Promise.all([
              // TODO: Implement loadChats and loadUserData
              Promise.resolve(),
            ]);
            setLastUpdate(new Date());
            lastUpdateRef.current = new Date();
          }
        } catch (error) {
          console.error('Realtime update failed:', error);
        } finally {
          setIsUpdating(false);
        }
      }, interval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start polling
    startPolling();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, start polling if not already running
        if (!intervalRef.current) {
          startPolling();
        }
      } else {
        // Page became hidden, stop polling to save resources
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isAuthenticated, interval, isUpdating]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await Promise.all([
        // TODO: Implement loadChats and loadUserData
        Promise.resolve(),
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!enabled || !isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleManualRefresh}
        disabled={isUpdating}
        className={`p-2 rounded-md transition-colors ${
          isUpdating
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'
        }`}
        title={isUpdating ? 'Updating...' : 'Refresh data'}
      >
        <svg 
          className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </button>
      
      {lastUpdate && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Hook for real-time updates
export function useRealtimeUpdates(options: {
  enabled?: boolean;
  interval?: number;
  onUpdate?: () => void;
} = {}) {
  const { enabled = true, interval = 30000, onUpdate } = options;
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const startPolling = () => {
      intervalRef.current = setInterval(async () => {
        if (isUpdating) return;

        setIsUpdating(true);
        try {
          if (document.visibilityState === 'visible') {
            onUpdate?.();
            setLastUpdate(new Date());
          }
        } catch (error) {
          console.error('Realtime update failed:', error);
        } finally {
          setIsUpdating(false);
        }
      }, interval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!intervalRef.current) {
          startPolling();
        }
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, isUpdating, onUpdate]);

  const manualUpdate = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      onUpdate?.();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Manual update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    lastUpdate,
    manualUpdate,
  };
}

// Message notification component
interface MessageNotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export function MessageNotification({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}: MessageNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`rounded-lg shadow-lg p-4 ${getTypeStyles()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification manager
class NotificationManager {
  private notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
  }> = [];

  private listeners: Array<(notifications: any[]) => void> = [];

  addNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.notifications.push({
      id,
      message,
      type,
      duration,
    });

    this.notifyListeners();

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    return id;
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(notification => notification.id !== id);
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getNotifications(): any[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: any[]) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
