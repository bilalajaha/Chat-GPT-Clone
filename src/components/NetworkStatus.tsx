'use client';

import React, { useState, useEffect } from 'react';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Clear the offline flag after a delay
      setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <div className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Back online</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
              <span className="text-sm font-medium">You're offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    isOffline: !isOnline,
  };
}

// Offline queue for API requests
class OfflineQueue {
  private queue: Array<{
    id: string;
    method: string;
    url: string;
    data?: any;
    timestamp: number;
  }> = [];

  private isProcessing = false;

  addRequest(method: string, url: string, data?: any): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.queue.push({
      id,
      method,
      url,
      data,
      timestamp: Date.now(),
    });

    // Store in localStorage for persistence
    this.saveToStorage();

    return id;
  }

  removeRequest(id: string): void {
    this.queue = this.queue.filter(request => request.id !== id);
    this.saveToStorage();
  }

  getQueue(): Array<{
    id: string;
    method: string;
    url: string;
    data?: any;
    timestamp: number;
  }> {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('offline_queue');
      if (stored) {
        try {
          this.queue = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse offline queue:', error);
          this.queue = [];
        }
      }
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Load from storage first
      this.loadFromStorage();

      const requests = [...this.queue];
      const processedIds: string[] = [];

      for (const request of requests) {
        try {
          // Replay the request
          const response = await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: request.data ? JSON.stringify(request.data) : undefined,
          });

          if (response.ok) {
            processedIds.push(request.id);
          }
        } catch (error) {
          console.error(`Failed to process offline request ${request.id}:`, error);
        }
      }

      // Remove processed requests
      this.queue = this.queue.filter(request => !processedIds.includes(request.id));
      this.saveToStorage();

    } finally {
      this.isProcessing = false;
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Hook for offline queue management
export function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (isOnline && offlineQueue.getQueue().length > 0) {
      offlineQueue.processQueue();
    }
  }, [isOnline]);

  return {
    queue: offlineQueue.getQueue(),
    addRequest: offlineQueue.addRequest.bind(offlineQueue),
    removeRequest: offlineQueue.removeRequest.bind(offlineQueue),
    clearQueue: offlineQueue.clear.bind(offlineQueue),
    processQueue: offlineQueue.processQueue.bind(offlineQueue),
  };
}