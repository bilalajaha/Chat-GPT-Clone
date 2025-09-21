'use client';

import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';

interface LoadingOverlayProps {
  message?: string;
  showNetworkStatus?: boolean;
}

export default function LoadingOverlay({ 
  message = 'Loading...', 
  showNetworkStatus = true 
}: LoadingOverlayProps) {
  const { state } = useAppState();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!state.loading.global) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="w-12 h-12 mx-auto mb-4">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          </div>
          
          {/* Loading Message */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {message}
          </h3>
          
          {/* Network Status */}
          {showNetworkStatus && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span>Offline</span>
                </>
              )}
            </div>
          )}
          
          {/* Loading Details */}
          <div className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            {state.loading.global && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Connecting to AI...</span>
              </div>
            )}
            {state.isLoading && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Processing chat...</span>
              </div>
            )}
            {state.isLoading && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Sending message...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
