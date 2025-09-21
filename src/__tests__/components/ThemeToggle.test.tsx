import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '@/components/ThemeToggle';

// Mock the useAppState hook
const mockToggleTheme = jest.fn();
const mockState = {
  theme: { mode: 'light' as const },
};

jest.mock('@/hooks/useAppState', () => ({
  useAppState: () => ({
    state: mockState,
    toggleTheme: mockToggleTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.theme.mode = 'light';
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('shows sun icon when in light mode', () => {
    render(<ThemeToggle />);
    
    const sunIcon = screen.getByTestId('sun-icon') || screen.getByRole('button').querySelector('svg');
    expect(sunIcon).toBeInTheDocument();
  });

  it('shows moon icon when in dark mode', () => {
    mockState.theme.mode = 'dark';
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('calls toggleTheme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('applies correct size classes for sm size', () => {
    render(<ThemeToggle size="sm" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-1.5');
  });

  it('applies correct size classes for md size', () => {
    render(<ThemeToggle size="md" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
  });

  it('applies correct size classes for lg size', () => {
    render(<ThemeToggle size="lg" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2.5');
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows label when showLabel is true', () => {
    render(<ThemeToggle showLabel={true} />);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('shows dark label when in dark mode and showLabel is true', () => {
    mockState.theme.mode = 'dark';
    render(<ThemeToggle showLabel={true} />);
    
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('does not show label when showLabel is false', () => {
    render(<ThemeToggle showLabel={false} />);
    
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
    expect(screen.queryByText('Dark')).not.toBeInTheDocument();
  });

  it('has proper focus styles', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500');
  });

  it('has proper hover styles', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:scale-105', 'active:scale-95');
  });

  it('has proper dark mode styles', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('dark:bg-gray-700', 'dark:hover:bg-gray-600');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(mockToggleTheme).toHaveBeenCalledTimes(2);
  });

  it('maintains accessibility attributes', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });
});
