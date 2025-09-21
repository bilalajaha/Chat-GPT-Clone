import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  LoadingCard,
  Skeleton,
  ChatSkeleton,
  ChatListSkeleton,
} from '@/components/LoadingStates';

describe('LoadingStates', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with small size', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with large size', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('LoadingOverlay', () => {
    it('renders when loading is true', () => {
      render(<LoadingOverlay isLoading={true} message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('does not render when loading is false', () => {
      render(<LoadingOverlay isLoading={false} />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('shows default message when no message provided', () => {
      render(<LoadingOverlay isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('LoadingButton', () => {
    it('renders button with children when not loading', () => {
      render(
        <LoadingButton isLoading={false}>
          Click me
        </LoadingButton>
      );
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders loading state when loading', () => {
      render(
        <LoadingButton
          isLoading={true}
          loadingText="Loading..."
        >
          Click me
        </LoadingButton>
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(
        <LoadingButton isLoading={true}>
          Click me
        </LoadingButton>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <LoadingButton disabled={true}>
          Click me
        </LoadingButton>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onClick when clicked and not loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton isLoading={true} onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('LoadingCard', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingCard isLoading={false}>
          <div>Card content</div>
        </LoadingCard>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('shows loading overlay when loading', () => {
      render(
        <LoadingCard isLoading={true}>
          <div>Card content</div>
        </LoadingCard>
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <LoadingCard isLoading={false} className="custom-class">
          <div>Card content</div>
        </LoadingCard>
      );
      const card = screen.getByText('Card content').parentElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Skeleton', () => {
    it('renders with default className', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'dark:bg-gray-700', 'rounded');
    });

    it('applies custom className', () => {
      render(<Skeleton className="w-10 h-10" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('w-10', 'h-10');
    });
  });

  describe('ChatSkeleton', () => {
    it('renders chat skeleton structure', () => {
      render(<ChatSkeleton />);
      
      // Check for skeleton elements
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ChatListSkeleton', () => {
    it('renders multiple chat item skeletons', () => {
      render(<ChatListSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
