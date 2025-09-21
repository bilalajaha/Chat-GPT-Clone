import { useCallback } from 'react';
import { useAppState } from './useAppState';

// Custom hook for error handling and recovery
export function useErrorHandler() {
  const { setError, clearError, state } = useAppState();

  // Handle API errors
  const handleApiError = useCallback((error: any, context?: string) => {
    console.error('API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorType: 'api' | 'network' | 'validation' | 'storage' = 'api';
    let retryable = true;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          errorType = 'validation';
          retryable = false;
          break;
        case 401:
          errorMessage = 'Authentication failed. Please check your API key.';
          errorType = 'api';
          retryable = false;
          break;
        case 403:
          errorMessage = 'Access forbidden. Please check your permissions.';
          errorType = 'api';
          retryable = false;
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later.';
          errorType = 'api';
          retryable = true;
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorType = 'api';
          retryable = true;
          break;
        default:
          errorMessage = `Server error (${status}). Please try again.`;
          errorType = 'api';
          retryable = true;
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
      errorType = 'network';
      retryable = true;
    } else if (error.message) {
      // Other error
      errorMessage = error.message;
      errorType = 'api';
      retryable = false;
    }

    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }

    setError(errorMessage);
  }, [setError]);

  // Handle storage errors
  const handleStorageError = useCallback((error: any, context?: string) => {
    console.error('Storage Error:', error);
    
    let errorMessage = 'Failed to save data locally';
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }

    setError(errorMessage);
  }, [setError]);

  // Handle validation errors
  const handleValidationError = useCallback((message: string, field?: string) => {
    const errorMessage = field ? `${field}: ${message}` : message;
    
    setError(errorMessage);
  }, [setError]);

  // Handle generic errors
  const handleError = useCallback((message: string, type: 'api' | 'network' | 'validation' | 'storage' = 'api', retryable: boolean = false) => {
    setError(message);
  }, [setError]);

  // Retry mechanism
  const retry = useCallback(async (retryFn: () => Promise<any>, maxRetries: number = 3) => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const result = await retryFn();
        clearError();
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          handleApiError(error, `Retry failed after ${maxRetries} attempts`);
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }, [clearError, handleApiError]);

  // Check if error is retryable
  const isRetryable = useCallback(() => {
    return false; // Simplified for now
  }, []);

  // Get error message
  const getErrorMessage = useCallback(() => {
    return state.error || '';
  }, [state.error]);

  // Get error type
  const getErrorType = useCallback(() => {
    return 'api'; // Simplified for now
  }, []);

  // Check if there's an error
  const hasError = useCallback(() => {
    return !!state.error;
  }, [state.error]);

  // Get user-friendly error message
  const getUserFriendlyMessage = useCallback(() => {
    if (!state.error) return null;

    // Simplified error message handling
    return state.error;
  }, [state.error]);

  return {
    // Error handling
    handleApiError,
    handleStorageError,
    handleValidationError,
    handleError,
    
    // Error management
    clearError,
    retry,
    
    // Error state
    hasError,
    isRetryable,
    getErrorMessage,
    getErrorType,
    getUserFriendlyMessage,
    
    // Current error state
    error: state.error,
  };
}
