'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300
        ${isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }
        ${showStatus ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}
