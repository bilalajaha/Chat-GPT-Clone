import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatSidebar from '@/components/ChatSidebar';

// Mock the hooks
jest.mock('@/hooks/useChatState', () => ({
  useChatState: jest.fn(),
}));

jest.mock('@/hooks/useAppState', () => ({
  useAppState: jest.fn(),
}));

// Mock child components
jest.mock('@/components/DataManagement', () => {
  return function MockDataManagement({ onClose }: any) {
    return (
      <div data-testid="data-management-modal">
        <button onClick={onClose} data-testid="close-data-management">
          Close
        </button>
      </div>
    );
  };
});

jest.mock('@/components/ThemeToggle', () => {
  return function MockThemeToggle({ size }: any) {
    return <div data-testid="theme-toggle" data-size={size}>Theme Toggle</div>;
  };
});

jest.mock('@/components/KeyboardShortcutsHelp', () => {
  return function MockKeyboardShortcutsHelp({ onClose }: any) {
    return (
      <div data-testid="keyboard-help-modal">
        <button onClick={onClose} data-testid="close-keyboard-help">
          Close
        </button>
      </div>
    );
  };
});

jest.mock('@/components/AdvancedSearch', () => {
  return function MockAdvancedSearch({ onClose }: any) {
    return (
      <div data-testid="advanced-search-modal">
        <button onClick={onClose} data-testid="close-advanced-search">
          Close
        </button>
      </div>
    );
  };
});

jest.mock('@/components/Settings', () => {
  return function MockSettings({ onClose }: any) {
    return (
      <div data-testid="settings-modal">
        <button onClick={onClose} data-testid="close-settings">
          Close
        </button>
      </div>
    );
  };
});

// Mock utils
jest.mock('@/utils', () => ({
  formatChatDate: jest.fn((date) => 'formatted-date'),
  truncateText: jest.fn((text, length) => text.length > length ? text.substring(0, length) + '...' : text),
}));

describe('ChatSidebar', () => {
  const mockUseChatState = require('@/hooks/useChatState').useChatState;
  const mockUseAppState = require('@/hooks/useAppState').useAppState;

  const mockChats = [
    {
      id: 'chat-1',
      title: 'Test Chat 1',
      messages: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: 'chat-2',
      title: 'Test Chat 2',
      messages: [],
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
    },
  ];

  const mockChatState = {
    chats: mockChats,
    currentChat: mockChats[0],
    createNewChat: jest.fn(),
    selectChat: jest.fn(),
    deleteChat: jest.fn(),
    renameChat: jest.fn(),
    clearAllChats: jest.fn(),
    searchChats: jest.fn((query) => 
      query ? mockChats.filter(chat => chat.title.toLowerCase().includes(query.toLowerCase())) : mockChats
    ),
  };

  const mockAppState = {
    state: {
      ui: {
        searchQuery: '',
        editingChatId: null,
        sidebarOpen: true,
      },
    },
    setSearchQuery: jest.fn(),
    setEditingChatId: jest.fn(),
    setSidebarOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatState.mockReturnValue(mockChatState);
    mockUseAppState.mockReturnValue(mockAppState);
    
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  it('renders sidebar with header and controls', () => {
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('ChatGPT Clone')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search chats...')).toBeInTheDocument();
  });

  it('renders chat list with correct chats', () => {
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
  });

  it('shows new chat button with correct text', () => {
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const newChatButton = screen.getByText('New Chat');
    expect(newChatButton).toBeInTheDocument();
    expect(newChatButton).toHaveAttribute('title', 'New Chat (Ctrl+N)');
  });

  it('shows mobile version of new chat button on mobile', () => {
    render(<ChatSidebar onToggle={jest.fn()} isMobile={true} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByText('New Chat')).not.toBeInTheDocument();
  });

  it('calls createNewChat when new chat button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const newChatButton = screen.getByText('New Chat');
    await user.click(newChatButton);
    
    expect(mockChatState.createNewChat).toHaveBeenCalled();
  });

  it('calls onToggle when new chat is created on mobile', async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();
    render(<ChatSidebar onToggle={mockOnToggle} isMobile={true} />);
    
    const newChatButton = screen.getByText('New');
    await user.click(newChatButton);
    
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('calls selectChat when chat is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const chatItem = screen.getByText('Test Chat 1');
    await user.click(chatItem);
    
    expect(mockChatState.selectChat).toHaveBeenCalledWith(mockChats[0]);
  });

  it('calls onToggle when chat is selected on mobile', async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();
    render(<ChatSidebar onToggle={mockOnToggle} isMobile={true} />);
    
    const chatItem = screen.getByText('Test Chat 1');
    await user.click(chatItem);
    
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('shows dropdown menu when more button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const moreButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.getAttribute('data-lucide') === 'more-vertical'
    );
    
    if (moreButton) {
      await user.click(moreButton);
      
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    }
  });

  it('handles chat rename', async () => {
    const user = userEvent.setup();
    mockAppState.state.ui.editingChatId = 'chat-1';
    mockUseAppState.mockReturnValue(mockAppState);
    
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const renameInput = screen.getByDisplayValue('Test Chat 1');
    await user.clear(renameInput);
    await user.type(renameInput, 'Renamed Chat');
    await user.keyboard('{Enter}');
    
    expect(mockChatState.renameChat).toHaveBeenCalledWith('chat-1', 'Renamed Chat');
    expect(mockAppState.setEditingChatId).toHaveBeenCalledWith(null);
  });

  it('cancels rename on Escape key', async () => {
    const user = userEvent.setup();
    mockAppState.state.ui.editingChatId = 'chat-1';
    mockUseAppState.mockReturnValue(mockAppState);
    
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const renameInput = screen.getByDisplayValue('Test Chat 1');
    await user.keyboard('{Escape}');
    
    expect(mockAppState.setEditingChatId).toHaveBeenCalledWith(null);
  });

  it('handles chat deletion', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    // Open dropdown first
    const moreButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.getAttribute('data-lucide') === 'more-vertical'
    );
    
    if (moreButton) {
      await user.click(moreButton);
      
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this chat?');
      expect(mockChatState.deleteChat).toHaveBeenCalledWith('chat-1');
    }
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const searchInput = screen.getByPlaceholderText('Search chats...');
    await user.type(searchInput, 'Test Chat 1');
    
    expect(mockAppState.setSearchQuery).toHaveBeenCalledWith('Test Chat 1');
  });

  it('shows no chats message when no chats exist', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      chats: [],
    });
    
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('No chats yet')).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', () => {
    mockAppState.state.ui.searchQuery = 'nonexistent';
    mockUseAppState.mockReturnValue(mockAppState);
    mockChatState.searchChats.mockReturnValue([]);
    
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('No chats found')).toBeInTheDocument();
  });

  it('opens data management modal when data button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const dataButton = screen.getByTitle('Data management');
    await user.click(dataButton);
    
    expect(screen.getByTestId('data-management-modal')).toBeInTheDocument();
  });

  it('opens keyboard help modal when shortcuts button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const shortcutsButton = screen.getByTitle('Keyboard shortcuts');
    await user.click(shortcutsButton);
    
    expect(screen.getByTestId('keyboard-help-modal')).toBeInTheDocument();
  });

  it('opens advanced search modal when search input is focused', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const searchInput = screen.getByPlaceholderText('Search chats...');
    await user.click(searchInput);
    
    expect(screen.getByTestId('advanced-search-modal')).toBeInTheDocument();
  });

  it('opens settings modal when settings button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const settingsButton = screen.getByTitle('Settings (Ctrl+,)');
    await user.click(settingsButton);
    
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('handles clear all chats with confirmation', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const clearAllButton = screen.getByTitle('Clear all chats');
    await user.click(clearAllButton);
    
    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to clear all chats? This action cannot be undone.');
    expect(mockChatState.clearAllChats).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    // Test settings shortcut (Ctrl+,)
    await user.keyboard('{Control>},{/Control}');
    
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    // Open dropdown
    const moreButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg')?.getAttribute('data-lucide') === 'more-vertical'
    );
    
    if (moreButton) {
      await user.click(moreButton);
      expect(screen.getByText('Rename')).toBeInTheDocument();
      
      // Click outside
      await user.click(document.body);
      
      expect(screen.queryByText('Rename')).not.toBeInTheDocument();
    }
  });

  it('shows correct theme toggle size', () => {
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toHaveAttribute('data-size', 'sm');
  });

  it('handles escape key to close dropdowns and editing', async () => {
    const user = userEvent.setup();
    mockAppState.state.ui.editingChatId = 'chat-1';
    mockUseAppState.mockReturnValue(mockAppState);
    
    render(<ChatSidebar onToggle={jest.fn()} isMobile={false} />);
    
    await user.keyboard('{Escape}');
    
    expect(mockAppState.setEditingChatId).toHaveBeenCalledWith(null);
  });
});
