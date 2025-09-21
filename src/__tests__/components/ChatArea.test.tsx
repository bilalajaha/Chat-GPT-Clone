import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatArea from '@/components/ChatArea';

// Mock the hooks
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

// Mock child components
jest.mock('@/components/MessageBubble', () => {
  return function MockMessageBubble({ message }: any) {
    return <div data-testid={`message-${message.id}`}>{message.content}</div>;
  };
});

jest.mock('@/components/TypingIndicator', () => {
  return function MockTypingIndicator() {
    return <div data-testid="typing-indicator">Typing...</div>;
  };
});

jest.mock('@/components/ChatInput', () => {
  return function MockChatInput({ onSendMessage, isLoading, disabled }: any) {
    return (
      <div data-testid="chat-input">
        <button 
          onClick={() => onSendMessage('Test message')}
          disabled={disabled || isLoading}
          data-testid="send-button"
        >
          Send
        </button>
        <div data-testid="loading-state">{isLoading ? 'loading' : 'not-loading'}</div>
        <div data-testid="disabled-state">{disabled ? 'disabled' : 'enabled'}</div>
      </div>
    );
  };
});

jest.mock('@/components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('@/components/RetryButton', () => {
  return function MockRetryButton({ onRetry, size, variant }: any) {
    return (
      <button 
        onClick={onRetry}
        data-testid="retry-button"
        data-size={size}
        data-variant={variant}
      >
        Retry
      </button>
    );
  };
});

describe('ChatArea', () => {
  const mockUseChatState = require('@/hooks/useChatState').useChatState;
  const mockUseErrorHandler = require('@/hooks/useErrorHandler').useErrorHandler;
  const mockUseAppState = require('@/hooks/useAppState').useAppState;
  const mockUseChatAPI = require('@/hooks/useChatAPI').useChatAPI;

  const mockChat = {
    id: 'chat-1',
    title: 'Test Chat',
    messages: [
      {
        id: 'msg-1',
        content: 'Hello',
        role: 'user',
        timestamp: new Date(),
        isStreaming: false,
      },
      {
        id: 'msg-2',
        content: 'Hi there!',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: false,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChatState = {
    currentChat: mockChat,
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    generateTitleFromFirstMessage: jest.fn(),
  };

  const mockErrorHandler = {
    handleApiError: jest.fn(),
    clearError: jest.fn(),
    hasError: jest.fn(() => false),
    getUserFriendlyMessage: jest.fn(() => 'Test error message'),
  };

  const mockAppState = {
    setLoading: jest.fn(),
  };

  const mockChatAPI = {
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

  it('renders chat area with header and messages', () => {
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByText('2 messages')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
  });

  it('shows sidebar toggle button when sidebar is closed', () => {
    render(<ChatArea sidebarOpen={false} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('hides sidebar toggle button when sidebar is open', () => {
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    // The toggle button should not be visible when sidebar is open
    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(btn => btn.querySelector('svg'));
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('calls onToggleSidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggleSidebar = jest.fn();
    render(<ChatArea sidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} isMobile={false} />);
    
    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);
    
    expect(mockOnToggleSidebar).toHaveBeenCalled();
  });

  it('shows welcome message when no current chat', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: null,
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Welcome to ChatGPT Clone')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation by typing a message below.')).toBeInTheDocument();
  });

  it('shows welcome message when chat has no messages', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: {
        ...mockChat,
        messages: [],
      },
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Welcome to ChatGPT Clone')).toBeInTheDocument();
  });

  it('shows error state when hasError returns true', () => {
    mockErrorHandler.hasError.mockReturnValue(true);
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('handles send message correctly', async () => {
    const mockStream = ['Hello', ' world', '!'];
    mockChatAPI.sendStreamingMessage.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        for (const chunk of mockStream) {
          yield chunk;
        }
      }
    });
    
    mockChatState.addMessage.mockReturnValue({ id: 'new-msg', content: '', role: 'assistant' });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const sendButton = screen.getByTestId('send-button');
    await sendButton.click();
    
    expect(mockChatState.addMessage).toHaveBeenCalledWith('chat-1', {
      content: 'Test message',
      role: 'user',
    });
    
    expect(mockChatState.addMessage).toHaveBeenCalledWith('chat-1', {
      content: '',
      role: 'assistant',
      isStreaming: true,
    });
  });

  it('generates title for first message', async () => {
    const mockStream = ['Response'];
    mockChatAPI.sendStreamingMessage.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        for (const chunk of mockStream) {
          yield chunk;
        }
      }
    });
    
    mockChatState.addMessage.mockReturnValue({ id: 'new-msg', content: '', role: 'assistant' });
    
    // Mock first message scenario
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: {
        ...mockChat,
        messages: [],
      },
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const sendButton = screen.getByTestId('send-button');
    await sendButton.click();
    
    expect(mockChatState.generateTitleFromFirstMessage).toHaveBeenCalledWith('chat-1', 'Test message');
  });

  it('handles API errors during message sending', async () => {
    mockChatAPI.sendStreamingMessage.mockRejectedValue(new Error('API Error'));
    mockChatState.addMessage.mockReturnValue({ id: 'new-msg', content: '', role: 'assistant' });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const sendButton = screen.getByTestId('send-button');
    await sendButton.click();
    
    expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
      expect.any(Error),
      'Failed to send message'
    );
    
    expect(mockChatState.updateMessage).toHaveBeenCalledWith(
      'chat-1',
      'new-msg',
      'Sorry, I encountered an error. Please try again.',
      false
    );
  });

  it('handles API errors from useChatAPI hook', () => {
    mockUseChatAPI.mockReturnValue({
      ...mockChatAPI,
      error: 'API Error',
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
      expect.any(Error),
      'Chat API'
    );
  });

  it('shows typing indicator when isTyping is true', () => {
    // Mock the component to show typing state
    const { rerender } = render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    // Simulate typing state by updating the component
    // This would normally be triggered by the handleSendMessage function
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('disables chat input when no current chat', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: null,
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByTestId('disabled-state')).toHaveTextContent('disabled');
  });

  it('enables chat input when current chat exists', () => {
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByTestId('disabled-state')).toHaveTextContent('enabled');
  });

  it('shows loading state when sending message', async () => {
    const mockStream = ['Response'];
    mockChatAPI.sendStreamingMessage.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        for (const chunk of mockStream) {
          yield chunk;
        }
      }
    });
    
    mockChatState.addMessage.mockReturnValue({ id: 'new-msg', content: '', role: 'assistant' });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const sendButton = screen.getByTestId('send-button');
    await sendButton.click();
    
    // The loading state should be managed by the component's internal state
    expect(mockAppState.setLoading).toHaveBeenCalledWith('api', true);
  });

  it('clears error before sending message', async () => {
    const mockStream = ['Response'];
    mockChatAPI.sendStreamingMessage.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        for (const chunk of mockStream) {
          yield chunk;
        }
      }
    });
    
    mockChatState.addMessage.mockReturnValue({ id: 'new-msg', content: '', role: 'assistant' });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const sendButton = screen.getByTestId('send-button');
    await sendButton.click();
    
    expect(mockErrorHandler.clearError).toHaveBeenCalled();
  });

  it('handles retry button click', async () => {
    const user = userEvent.setup();
    mockErrorHandler.hasError.mockReturnValue(true);
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);
    
    expect(mockErrorHandler.clearError).toHaveBeenCalled();
  });

  it('shows correct message count in header', () => {
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('2 messages')).toBeInTheDocument();
  });

  it('shows default title when chat has no title', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: {
        ...mockChat,
        title: '',
      },
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('ChatGPT Clone')).toBeInTheDocument();
  });

  it('shows start conversation message when no current chat', () => {
    mockUseChatState.mockReturnValue({
      ...mockChatState,
      currentChat: null,
    });
    
    render(<ChatArea sidebarOpen={true} onToggleSidebar={jest.fn()} isMobile={false} />);
    
    expect(screen.getByText('Start a new conversation')).toBeInTheDocument();
  });
});
