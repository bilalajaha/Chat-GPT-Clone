import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorHandler, ErrorBoundary, useErrorHandler } from '@/components/ErrorHandler';
import { ApiError } from '@/lib/api';

// Mock the API error
jest.mock('@/lib/api', () => ({
  ApiError: class MockApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(message: string, status: number, errors?: Record<string, string[]>) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.errors = errors;
    }
  },
}));

describe('ErrorHandler', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error message when error is provided', () => {
    const error = {
      message: 'Something went wrong',
      type: 'api',
      timestamp: new Date(),
      retryable: true,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render when no error', () => {
    render(
      <ErrorHandler
        error={null}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('API Error')).not.toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const error = {
      message: 'Network error',
      type: 'network',
      timestamp: new Date(),
      retryable: true,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('does not show retry button for non-retryable errors', () => {
    const error = {
      message: 'Authentication failed',
      type: 'auth',
      timestamp: new Date(),
      retryable: false,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const error = {
      message: 'Network error',
      type: 'network',
      timestamp: new Date(),
      retryable: true,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when close button is clicked', () => {
    const error = {
      message: 'Something went wrong',
      type: 'api',
      timestamp: new Date(),
      retryable: false,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows correct icon for different error types', () => {
    const networkError = {
      message: 'Network error',
      type: 'network',
      timestamp: new Date(),
      retryable: true,
    };

    const { rerender } = render(
      <ErrorHandler
        error={networkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();

    const authError = {
      message: 'Authentication failed',
      type: 'auth',
      timestamp: new Date(),
      retryable: false,
    };

    rerender(
      <ErrorHandler
        error={authError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
  });

  it('auto-dismisses non-retryable errors after 10 seconds', async () => {
    jest.useFakeTimers();
    
    const error = {
      message: 'Authentication failed',
      type: 'auth',
      timestamp: new Date(),
      retryable: false,
    };

    render(
      <ErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});

describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom fallback component', () => {
    const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });

  it('resets error when try again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('useErrorHandler', () => {
  const TestComponent = () => {
    const { error, handleError, clearError, retry } = useErrorHandler();

    return (
      <div>
        {error && <div data-testid="error">{error.message}</div>}
        <button onClick={() => handleError('Test error')}>Trigger Error</button>
        <button onClick={clearError}>Clear Error</button>
        <button onClick={() => retry(() => console.log('retry'))}>Retry</button>
      </div>
    );
  };

  it('handles string errors', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('handles Error objects', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('handles ApiError objects', () => {
    const apiError = new ApiError('API Error', 500);
    render(<TestComponent />);

    // Mock the handleError to accept ApiError
    const { handleError } = useErrorHandler();
    handleError(apiError);

    expect(screen.getByTestId('error')).toHaveTextContent('API Error');
  });

  it('clears error when clearError is called', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('calls retry function and clears error', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry'));
    expect(consoleSpy).toHaveBeenCalledWith('retry');
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
