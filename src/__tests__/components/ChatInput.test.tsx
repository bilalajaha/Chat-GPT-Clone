import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/components/ChatInput';

// Mock the LoadingSpinner component
jest.mock('@/components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it('renders input field and send button', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    expect(screen.getByTitle('Send message')).toBeInTheDocument();
    expect(screen.getByTitle('Attach file')).toBeInTheDocument();
    expect(screen.getByTitle('Start voice recording')).toBeInTheDocument();
  });

  it('calls onSendMessage when send button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByTitle('Send message');
    
    await user.type(input, 'Hello, world!');
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, world!');
  });

  it('calls onSendMessage when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('does not send message when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    
    await user.type(input, 'Test message');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByTitle('Send message');
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(input).toHaveValue('');
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const sendButton = screen.getByTitle('Send message');
    
    await user.click(sendButton);
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByTitle('Send message');
    
    await user.type(input, '   ');
    await user.click(sendButton);
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('disables input and buttons when isLoading is true', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByTitle('Send message');
    const fileButton = screen.getByTitle('Attach file');
    const voiceButton = screen.getByTitle('Start voice recording');
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(fileButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();
  });

  it('disables input and buttons when disabled prop is true', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} disabled={true} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByTitle('Send message');
    const fileButton = screen.getByTitle('Attach file');
    const voiceButton = screen.getByTitle('Start voice recording');
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(fileButton).toBeDisabled();
    expect(voiceButton).toBeDisabled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles voice recording toggle', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const voiceButton = screen.getByTitle('Start voice recording');
    
    await user.click(voiceButton);
    
    expect(screen.getByTitle('Stop recording')).toBeInTheDocument();
    expect(screen.getByText('• Recording...')).toBeInTheDocument();
  });

  it('handles file upload click', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const fileButton = screen.getByTitle('Attach file');
    await user.click(fileButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('File upload clicked');
    
    consoleSpy.mockRestore();
  });

  it('shows helper text', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
  });

  it('auto-resizes textarea based on content', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />);
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    
    // Type a long message
    await user.type(textarea, 'This is a very long message that should cause the textarea to resize');
    
    // The textarea should have its height adjusted
    expect(textarea.style.height).not.toBe('auto');
  });
});
