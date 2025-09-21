import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '@/components/ChatInterface';

// Mock the hooks
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })),
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

// Mock the child components
jest.mock('@/components/ChatSidebar', () => {
  return function MockChatSidebar({ onToggle, isMobile }: any) {
    return (
      <div data-testid="chat-sidebar">
        <button onClick={onToggle} data-testid="sidebar-toggle">
          Toggle Sidebar
        </button>
        <div data-testid="sidebar-mobile">{isMobile ? 'mobile' : 'desktop'}</div>
      </div>
    );
  };
});

jest.mock('@/components/ChatArea', () => {
  return function MockChatArea({ sidebarOpen, onToggleSidebar, isMobile }: any) {
    return (
      <div data-testid="chat-area">
        <div data-testid="sidebar-open">{sidebarOpen ? 'open' : 'closed'}</div>
        <button onClick={onToggleSidebar} data-testid="area-toggle">
          Toggle from Area
        </button>
        <div data-testid="area-mobile">{isMobile ? 'mobile' : 'desktop'}</div>
      </div>
    );
  };
});

describe('ChatInterface', () => {
  const mockUseResponsive = require('@/hooks/useResponsive').useResponsive;
  const mockUseKeyboardShortcuts = require('@/hooks/useKeyboardShortcuts').useKeyboardShortcuts;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface with sidebar and main area', () => {
    render(<ChatInterface />);
    
    expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
  });

  it('initializes keyboard shortcuts', () => {
    render(<ChatInterface />);
    
    expect(mockUseKeyboardShortcuts).toHaveBeenCalled();
  });

  it('shows sidebar as open on desktop by default', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open');
  });

  it('closes sidebar on mobile by default', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('closes sidebar on tablet by default', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('toggles sidebar when sidebar toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    await user.click(toggleButton);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('toggles sidebar when area toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    
    const toggleButton = screen.getByTestId('area-toggle');
    await user.click(toggleButton);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('shows mobile overlay when sidebar is open on mobile', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ChatInterface />);
    
    // First open the sidebar
    const toggleButton = screen.getByTestId('sidebar-toggle');
    fireEvent.click(toggleButton);
    
    // Check if mobile overlay is present
    const overlay = screen.getByRole('generic', { hidden: true });
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('closes sidebar when mobile overlay is clicked', async () => {
    const user = userEvent.setup();
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ChatInterface />);
    
    // Open sidebar first
    const toggleButton = screen.getByTestId('sidebar-toggle');
    await user.click(toggleButton);
    
    // Click overlay to close
    const overlay = screen.getByRole('generic', { hidden: true });
    await user.click(overlay);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('passes correct mobile state to components', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-mobile')).toHaveTextContent('mobile');
    expect(screen.getByTestId('area-mobile')).toHaveTextContent('mobile');
  });

  it('passes correct desktop state to components', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-mobile')).toHaveTextContent('desktop');
    expect(screen.getByTestId('area-mobile')).toHaveTextContent('desktop');
  });

  it('updates sidebar state when responsive breakpoint changes', () => {
    const { rerender } = render(<ChatInterface />);
    
    // Start with desktop
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open');
    
    // Change to mobile
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
    
    rerender(<ChatInterface />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });

  it('applies correct CSS classes for sidebar states', () => {
    render(<ChatInterface />);
    
    const sidebar = screen.getByTestId('chat-sidebar').parentElement;
    expect(sidebar).toHaveClass('w-80'); // Open state
    
    // Toggle to closed
    const toggleButton = screen.getByTestId('sidebar-toggle');
    fireEvent.click(toggleButton);
    
    // Check if sidebar has correct classes for closed state
    expect(sidebar).toHaveClass('w-0');
  });

  it('handles multiple rapid toggles correctly', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    
    // Multiple rapid clicks
    await user.click(toggleButton);
    await user.click(toggleButton);
    await user.click(toggleButton);
    
    // Should end up in closed state (odd number of clicks)
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed');
  });
});
