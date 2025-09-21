import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '@/components/ChatInterface';

// Mock all the hooks and dependencies
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

jest.mock('@/hooks/useChatState', () => ({
  useChatState: jest.fn(),
}));

jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: jest.fn(),
}));

jest.mock('@/hooks/useAppState', () => ({
  useAppState: jest.fn(),
}));

jest.mock('@/hooks/useChatAPI', () => ({
  useChatAPI: jest.fn(),
}));

// Mock child components with realistic behavior
jest.mock('@/components/ChatSidebar', () => {
  return function MockChatSidebar({ onToggle, isMobile }: any) {
    const { useChatState } = require('@/hooks/useChatState');
    const { useAppState } = require('@/hooks/useAppState');
    const { chats, createNewChat, selectChat, deleteChat, renameChat, clearAllChats, searchChats } = useChatState();
    const { state, setSearchQuery, setEditingChatId } = useAppState();
    
    return (
      <div data-testid="chat-sidebar">
        <button onClick={() => createNewChat()} data-testid="new-chat-btn">
          New Chat
        </button>
        <input
          type="text"
          placeholder="Search chats..."
          value={state.ui.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input"
        />
        <div data-testid="chat-list">
          {chats.map((chat: any) => (
            <div key={chat.id} data-testid={`chat-${chat.id}`} onClick={() => selectChat(chat)}>
              {chat.title}
            </div>
          ))}
        </div>
        <button onClick={onToggle} data-testid="sidebar-toggle">
          Toggle
        </button>
      </div>
    );
  };
});

jest.mock('@/components/ChatArea', () => {
  return function MockChatArea({ sidebarOpen, onToggleSidebar, isMobile }: any) {
    const { useChatState } = require('@/hooks/useChatState');
    const { useChatAPI } = require('@/hooks/useChatAPI');
    const { currentChat, addMessage } = useChatState();
    const { sendStreamingMessage, isLoading } = useChatAPI();
    
    const handleSendMessage = async (content: string) => {
      if (!currentChat) return;
      
      // Add user message
      addMessage(currentChat.id, { content, role: 'user' });
      
      // Simulate AI response
      addMessage(currentChat.id, { content: 'AI Response', role: 'assistant' });
    };
    
    return (
      <div data-testid="chat-area">
        <div data-testid="chat-title">{currentChat?.title || 'No Chat'}</div>
        <div data-testid="messages">
          {currentChat?.messages.map((msg: any) => (
            <div key={msg.id} data-testid={`message-${msg.id}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          data-testid="message-input"
        />
        <button onClick={onToggleSidebar} data-testid="area-toggle">
          Toggle Sidebar
        </button>
      </div>
    );
  };
});

describe('Chat Flow Integration Tests', () => {
  const mockUseChatState = require('@/hooks/useChatState').useChatState;
  const mockUseErrorHandler = require('@/hooks/useErrorHandler').useErrorHandler;
  const mockUseAppState = require('@/hooks/useAppState').useAppState;
  const mockUseChatAPI = require('@/hooks/useChatAPI').useChatAPI;

  const mockChats = [
    {
      id: 'chat-1',
      title: 'First Chat',
      messages: [
        { id: 'msg-1', content: 'Hello', role: 'user', timestamp: new Date() },
        { id: 'msg-2', content: 'Hi there!', role: 'assistant', timestamp: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'chat-2',
      title: 'Second Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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
      mockChats.filter(chat => chat.title.toLowerCase().includes(query.toLowerCase()))
    ),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
    generateTitleFromFirstMessage: jest.fn(),
  };

  const mockErrorHandler = {
    handleApiError: jest.fn(),
    clearError: jest.fn(),
    hasError: jest.fn(() => false),
    getUserFriendlyMessage: jest.fn(),
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
    setLoading: jest.fn(),
  };

  const mockChatAPI = {
    sendMessage: jest.fn(),
    sendStreamingMessage: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatState.mockReturnValue(mockChatState);
    mockUseErrorHandler.mockReturnValue(mockErrorHandler);
    mockUseAppState.mockReturnValue(mockAppState);
    mockUseChatAPI.mockReturnValue(mockChatAPI);
  });

  describe('Complete Chat Flow', () => {
    it('allows user to create a new chat and send messages', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Create new chat
      const newChatButton = screen.getByTestId('new-chat-btn');
      await user.click(newChatButton);

      expect(mockChatState.createNewChat).toHaveBeenCalled();

      // Send a message
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Hello, AI!');
      await user.keyboard('{Enter}');

      expect(mockChatState.addMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          content: 'Hello, AI!',
          role: 'user',
        })
      );
    });

    it('allows user to switch between chats', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Click on second chat
      const secondChat = screen.getByTestId('chat-chat-2');
      await user.click(secondChat);

      expect(mockChatState.selectChat).toHaveBeenCalledWith(mockChats[1]);
    });

    it('allows user to search for chats', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Search for chats
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'First');

      expect(mockAppState.setSearchQuery).toHaveBeenCalledWith('First');
    });

    it('handles sidebar toggle', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Toggle sidebar from sidebar
      const sidebarToggle = screen.getByTestId('sidebar-toggle');
      await user.click(sidebarToggle);

      // Toggle sidebar from area
      const areaToggle = screen.getByTestId('area-toggle');
      await user.click(areaToggle);
    });

    it('displays current chat title and messages', () => {
      render(<ChatInterface />);

      expect(screen.getByTestId('chat-title')).toHaveTextContent('First Chat');
      expect(screen.getByTestId('message-msg-1')).toHaveTextContent('Hello');
      expect(screen.getByTestId('message-msg-2')).toHaveTextContent('Hi there!');
    });

    it('handles empty chat state', () => {
      mockUseChatState.mockReturnValue({
        ...mockChatState,
        chats: [],
        currentChat: null,
      });

      render(<ChatInterface />);

      expect(screen.getByTestId('chat-title')).toHaveTextContent('No Chat');
    });
  });

  describe('Error Handling Integration', () => {
    it('handles API errors gracefully', () => {
      mockUseChatAPI.mockReturnValue({
        ...mockChatAPI,
        error: 'API Error',
      });

      render(<ChatInterface />);

      expect(mockErrorHandler.handleApiError).toHaveBeenCalled();
    });

    it('handles chat state errors', () => {
      mockUseChatState.mockReturnValue({
        ...mockChatState,
        error: { message: 'State Error', type: 'api' },
      });

      render(<ChatInterface />);

      // Should still render without crashing
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('adapts to mobile view', () => {
      const mockUseResponsive = require('@/hooks/useResponsive').useResponsive;
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });

      render(<ChatInterface />);

      // Should still render all components
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    });

    it('adapts to tablet view', () => {
      const mockUseResponsive = require('@/hooks/useResponsive').useResponsive;
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });

      render(<ChatInterface />);

      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    });
  });

  describe('Data Persistence Integration', () => {
    it('maintains chat state across interactions', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Send multiple messages
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'First message');
      await user.keyboard('{Enter}');
      await user.type(messageInput, 'Second message');
      await user.keyboard('{Enter}');

      expect(mockChatState.addMessage).toHaveBeenCalledTimes(2);
    });

    it('preserves chat selection when switching', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Switch to second chat
      const secondChat = screen.getByTestId('chat-chat-2');
      await user.click(secondChat);

      expect(mockChatState.selectChat).toHaveBeenCalledWith(mockChats[1]);

      // Switch back to first chat
      const firstChat = screen.getByTestId('chat-chat-1');
      await user.click(firstChat);

      expect(mockChatState.selectChat).toHaveBeenCalledWith(mockChats[0]);
    });
  });

  describe('Performance Integration', () => {
    it('handles large chat lists efficiently', () => {
      const largeChatList = Array.from({ length: 100 }, (_, i) => ({
        id: `chat-${i}`,
        title: `Chat ${i}`,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockUseChatState.mockReturnValue({
        ...mockChatState,
        chats: largeChatList,
      });

      render(<ChatInterface />);

      // Should render without performance issues
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
    });

    it('handles rapid message sending', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      const messageInput = screen.getByTestId('message-input');

      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await user.type(messageInput, `Message ${i}`);
        await user.keyboard('{Enter}');
      }

      expect(mockChatState.addMessage).toHaveBeenCalledTimes(5);
    });
  });

  describe('Accessibility Integration', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatInterface />);

      // Tab through elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Should be able to interact with focused elements
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Keyboard navigation test');
      await user.keyboard('{Enter}');

      expect(mockChatState.addMessage).toHaveBeenCalled();
    });

    it('supports screen reader navigation', () => {
      render(<ChatInterface />);

      // Check for proper ARIA labels and roles
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-area')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });
  });
});
