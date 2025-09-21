import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from '@/components/MessageBubble';
import { Message } from '@/types';

// Mock the MessageActions component
jest.mock('@/components/MessageActions', () => {
  return function MockMessageActions({ onRegenerate, onDelete }: any) {
    return (
      <div data-testid="message-actions">
        {onRegenerate && (
          <button onClick={onRegenerate} data-testid="regenerate-btn">
            Regenerate
          </button>
        )}
        <button onClick={onDelete} data-testid="delete-btn">
          Delete
        </button>
      </div>
    );
  };
});

// Mock the formatDate utility
jest.mock('@/utils', () => ({
  formatDate: jest.fn((date) => date.toLocaleString()),
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    isStreaming: false,
  };

  const mockAssistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2023-01-01T10:01:00Z'),
    isStreaming: false,
  };

  const mockStreamingMessage: Message = {
    id: '3',
    role: 'assistant',
    content: 'This is a streaming message...',
    timestamp: new Date('2023-01-01T10:02:00Z'),
    isStreaming: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    expect(screen.getByText('Bot')).toBeInTheDocument();
  });

  it('shows message actions on hover', async () => {
    const user = userEvent.setup();
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div');
    
    await user.hover(messageContainer!);
    
    expect(screen.getByTestId('message-actions')).toBeInTheDocument();
    expect(screen.getByTestId('regenerate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('hides message actions when not hovered', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument();
  });

  it('shows streaming indicator for streaming messages', () => {
    render(<MessageBubble message={mockStreamingMessage} />);
    
    const streamingDots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    );
    
    expect(streamingDots).toHaveLength(3);
  });

  it('does not show streaming indicator for non-streaming messages', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    
    const streamingDots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    );
    
    expect(streamingDots).toHaveLength(0);
  });

  it('calls regenerate handler when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div');
    await user.hover(messageContainer!);
    
    const regenerateBtn = screen.getByTestId('regenerate-btn');
    await user.click(regenerateBtn);
    
    expect(consoleSpy).toHaveBeenCalledWith('Regenerate message:', '1');
    
    consoleSpy.mockRestore();
  });

  it('calls delete handler when delete button is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div');
    await user.hover(messageContainer!);
    
    const deleteBtn = screen.getByTestId('delete-btn');
    await user.click(deleteBtn);
    
    expect(consoleSpy).toHaveBeenCalledWith('Delete message:', '1');
    
    consoleSpy.mockRestore();
  });

  it('does not show regenerate button for assistant messages', async () => {
    const user = userEvent.setup();
    render(<MessageBubble message={mockAssistantMessage} />);
    
    const messageContainer = screen.getByText('I am doing well, thank you for asking!').closest('div');
    await user.hover(messageContainer!);
    
    expect(screen.queryByTestId('regenerate-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div');
    expect(messageContainer).toHaveClass('flex-row-reverse');
  });

  it('applies correct styling for assistant messages', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    
    const messageContainer = screen.getByText('I am doing well, thank you for asking!').closest('div');
    expect(messageContainer).toHaveClass('flex-row');
  });

  it('displays timestamp correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    // The formatDate function is mocked to return the date as string
    expect(screen.getByText(mockUserMessage.timestamp.toLocaleString())).toBeInTheDocument();
  });

  it('handles long content correctly', () => {
    const longMessage: Message = {
      ...mockUserMessage,
      content: 'This is a very long message that should wrap properly and maintain readability across multiple lines of text.',
    };
    
    render(<MessageBubble message={longMessage} />);
    
    expect(screen.getByText(longMessage.content)).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const emptyMessage: Message = {
      ...mockUserMessage,
      content: '',
    };
    
    render(<MessageBubble message={emptyMessage} />);
    
    const messageText = screen.getByRole('generic');
    expect(messageText).toBeInTheDocument();
  });
});
