'use client';

import React, { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

interface ErrorHandlerProps {
  error: {
    message: string | null;
    type: string | null;
    timestamp: Date | null;
    retryable: boolean;
  } | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorHandler({ error, onRetry, onDismiss, className = '' }: ErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error && error.message) {
      setIsVisible(true);
      
      // Auto-dismiss after 10 seconds for non-retryable errors
      if (!error.retryable) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, onDismiss]);

  if (!isVisible || !error || !error.message) {
    return null;
  }

  const getErrorIcon = (type: string | null) => {
    switch (type) {
      case 'network':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'auth':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'api':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorColor = (type: string | null) => {
    switch (type) {
      case 'network':
        return 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      case 'auth':
        return 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
      case 'api':
        return 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-200';
      default:
        return 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
    }
  };

  const getRetryButtonColor = (type: string | null) => {
    switch (type) {
      case 'network':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'auth':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'api':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <div className={`border rounded-lg shadow-lg p-4 ${getErrorColor(error.type)}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getErrorIcon(error.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {error.type === 'network' && 'Connection Error'}
                {error.type === 'auth' && 'Authentication Error'}
                {error.type === 'api' && 'API Error'}
                {!error.type && 'Error'}
              </h3>
              
              <button
                onClick={() => {
                  setIsVisible(false);
                  onDismiss?.();
                }}
                className="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mt-1 text-sm opacity-90">
              {error.message}
            </p>
            
            {error.timestamp && (
              <p className="mt-1 text-xs opacity-75">
                {error.timestamp.toLocaleTimeString()}
              </p>
            )}
            
            {error.retryable && onRetry && (
              <div className="mt-3">
                <button
                  onClick={onRetry}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${getRetryButtonColor(error.type)}`}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              An unexpected error occurred
            </p>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            {error.message}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for handling API errors
export function useErrorHandler() {
  const [error, setError] = useState<{
    message: string | null;
    type: string | null;
    timestamp: Date | null;
    retryable: boolean;
  } | null>(null);

  const handleError = (error: any, retryable: boolean = true) => {
    let message = 'An unexpected error occurred';
    let type = 'unknown';

    if (error instanceof ApiError) {
      message = error.message;
      type = error.status === 401 ? 'auth' : 
             error.status === 0 ? 'network' : 'api';
    } else if (error instanceof Error) {
      message = error.message;
      type = 'unknown';
    } else if (typeof error === 'string') {
      message = error;
      type = 'unknown';
    }

    setError({
      message,
      type,
      timestamp: new Date(),
      retryable,
    });
  };

  const clearError = () => {
    setError(null);
  };

  const retry = (retryFn: () => void) => {
    clearError();
    retryFn();
  };

  return {
    error,
    handleError,
    clearError,
    retry,
  };
}
