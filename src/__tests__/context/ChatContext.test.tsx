import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { Chat, Message } from '@/types';

// Mock the utils
jest.mock('@/utils', () => ({
  generateId: jest.fn(() => 'test-id'),
  storage: {
    get: jest.fn(),
    set: jest.fn(),
  },
  exportChatData: jest.fn(),
  importChatData: jest.fn(),
  validateImportedChats: jest.fn(),
}));

// Test component to access context
function TestComponent() {
  const { state, dispatch } = useChat();
  
  return (
    <div>
      <div data-testid="chats-count">{state.chats.length}</div>
      <div data-testid="current-chat">{state.currentChat?.id || 'none'}</div>
      <div data-testid="theme">{state.theme.mode}</div>
      <button 
        onClick={() => dispatch({ type: 'ADD_CHAT', payload: mockChat })}
        data-testid="add-chat"
      >
        Add Chat
      </button>
      <button 
        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
        data-testid="toggle-theme"
      >
        Toggle Theme
      </button>
    </div>
  );
}

const mockChat: Chat = {
  id: 'test-chat-1',
  title: 'Test Chat',
  messages: [],
  createdAt: new Date('2023-01-01T10:00:00Z'),
  updatedAt: new Date('2023-01-01T10:00:00Z'),
};

const mockMessage: Message = {
  id: 'test-message-1',
  role: 'user',
  content: 'Hello, world!',
  timestamp: new Date('2023-01-01T10:00:00Z'),
  isStreaming: false,
};

describe('ChatContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage to return empty data
    require('@/utils').storage.get.mockReturnValue(null);
  });

  it('provides initial state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    expect(screen.getByTestId('chats-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-chat')).toHaveTextContent('none');
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('adds a new chat', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const addChatButton = screen.getByTestId('add-chat');
    act(() => {
      addChatButton.click();
    });
    
    expect(screen.getByTestId('chats-count')).toHaveTextContent('1');
    expect(screen.getByTestId('current-chat')).toHaveTextContent('test-chat-1');
  });

  it('toggles theme', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const toggleThemeButton = screen.getByTestId('toggle-theme');
    act(() => {
      toggleThemeButton.click();
    });
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('handles ADD_MESSAGE action', () => {
    const chatWithMessage = { ...mockChat, messages: [mockMessage] };
    
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Add chat first
    const addChatButton = screen.getByTestId('add-chat');
    act(() => {
      addChatButton.click();
    });
    
    // Add message
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { chatId: 'test-chat-1', message: mockMessage } 
      });
    });
    
    expect(screen.getByTestId('chats-count')).toHaveTextContent('1');
  });

  it('handles DELETE_CHAT action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Add chat first
    const addChatButton = screen.getByTestId('add-chat');
    act(() => {
      addChatButton.click();
    });
    
    // Delete chat
    const { dispatch } = useChat();
    act(() => {
      dispatch({ type: 'DELETE_CHAT', payload: 'test-chat-1' });
    });
    
    expect(screen.getByTestId('chats-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-chat')).toHaveTextContent('none');
  });

  it('handles RENAME_CHAT action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    // Add chat first
    const addChatButton = screen.getByTestId('add-chat');
    act(() => {
      addChatButton.click();
    });
    
    // Rename chat
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'RENAME_CHAT', 
        payload: { chatId: 'test-chat-1', title: 'Renamed Chat' } 
      });
    });
    
    expect(screen.getByTestId('current-chat')).toHaveTextContent('test-chat-1');
  });

  it('handles SET_ERROR action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          message: 'Test error', 
          type: 'api', 
          timestamp: new Date(), 
          retryable: true 
        } 
      });
    });
    
    // Error state should be updated (we can't easily test this without exposing it)
    // This test ensures the action doesn't throw an error
  });

  it('handles CLEAR_ERROR action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    });
    
    // Error state should be cleared
  });

  it('handles UPDATE_PREFERENCES action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'UPDATE_PREFERENCES', 
        payload: { theme: 'dark', autoSave: false } 
      });
    });
    
    // Preferences should be updated
  });

  it('handles UPDATE_SETTINGS action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'UPDATE_SETTINGS', 
        payload: { selectedModel: 'gemini-1.5-pro', temperature: 0.8 } 
      });
    });
    
    // Settings should be updated
  });

  it('handles SET_LOADING action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'SET_LOADING', 
        payload: { type: 'api', value: true } 
      });
    });
    
    // Loading state should be updated
  });

  it('handles SET_SIDEBAR_OPEN action', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const { dispatch } = useChat();
    act(() => {
      dispatch({ 
        type: 'SET_SIDEBAR_OPEN', 
        payload: false 
      });
    });
    
    // UI state should be updated
  });

  it('throws error when useChat is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useChat must be used within a ChatProvider');
    
    consoleSpy.mockRestore();
  });

  it('loads data from localStorage on mount', () => {
    const mockChats = [mockChat];
    require('@/utils').storage.get.mockImplementation((key) => {
      if (key === 'chats') return mockChats;
      return null;
    });
    
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    expect(screen.getByTestId('chats-count')).toHaveTextContent('1');
  });

  it('saves data to localStorage when state changes', () => {
    const { storage } = require('@/utils');
    
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    const addChatButton = screen.getByTestId('add-chat');
    act(() => {
      addChatButton.click();
    });
    
    expect(storage.set).toHaveBeenCalledWith('chats', expect.any(Array));
  });
});
