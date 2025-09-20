'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function ErrorNotification() {
  const { 
    hasError, 
    getErrorMessage, 
    getErrorType, 
    isRetryable, 
    clearError, 
    retry 
  } = useErrorHandler();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasError()) {
      setIsVisible(true);
      // Auto-hide after 10 seconds for non-retryable errors
      if (!isRetryable()) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(clearError, 300); // Clear error after animation
        }, 10000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [hasError, isRetryable, clearError]);

  if (!hasError() || !isVisible) return null;

  const errorType = getErrorType();
  const errorMessage = getErrorMessage();

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-5 h-5" />;
      case 'api':
        return <AlertTriangle className="w-5 h-5" />;
      case 'validation':
        return <AlertTriangle className="w-5 h-5" />;
      case 'storage':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'network':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'api':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'validation':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
      case 'storage':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    }
  };

  const handleRetry = async () => {
    if (isRetryable()) {
      try {
        await retry(async () => {
          // This would be called with the actual retry function
          // For now, we'll just clear the error
          clearError();
        });
      } catch (error) {
        // Retry failed, error is already handled by the retry function
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(clearError, 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`
        ${getErrorColor()}
        border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
      `}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getErrorIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {errorType === 'network' && 'Connection Error'}
                {errorType === 'api' && 'API Error'}
                {errorType === 'validation' && 'Validation Error'}
                {errorType === 'storage' && 'Storage Error'}
                {!errorType && 'Error'}
              </h4>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm mt-1 break-words">
              {errorMessage}
            </p>
            
            {isRetryable() && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
