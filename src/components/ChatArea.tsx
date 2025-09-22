'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Bot } from 'lucide-react';
import { useChatState } from '@/hooks/useChatState';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAppState } from '@/hooks/useAppState';
import { useChatAPI } from '@/hooks/useChatAPI';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import LoadingSpinner from './LoadingSpinner';
import RetryButton from './RetryButton';

interface ChatAreaProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export default function ChatArea({ sidebarOpen, onToggleSidebar, isMobile }: ChatAreaProps) {
  const { currentChat, addMessage, updateMessage, generateTitleFromFirstMessage, createNewChat } = useChatState();
  const { handleApiError, clearError, hasError, getUserFriendlyMessage } = useErrorHandler();
  const { setLoading } = useAppState();
  const { sendStreamingMessage, isLoading, error } = useChatAPI();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [currentChat?.messages]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      handleApiError(new Error(error), 'Chat API');
    }
  }, [error, handleApiError]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;
    
    // Auto-create chat if none exists
    let chatToUse = currentChat;
    if (!chatToUse) {
      chatToUse = createNewChat();
    }

    // Clear any existing errors
    clearError();

    // Add user message
    const userMessage = addMessage(chatToUse.id, {
      content: messageContent.trim(),
      role: 'user',
    });

    // Generate chat title if this is the first message
    if (chatToUse.messages.length === 0) {
      generateTitleFromFirstMessage(chatToUse.id, messageContent.trim());
    }

    // Create AI message placeholder for streaming
    const aiMessage = addMessage(chatToUse.id, {
      content: '',
      role: 'assistant',
      isStreaming: true,
    });

    setIsTyping(true);
    setLoading(true);

    try {
      // Prepare messages for API call (exclude the user message we just added)
      const messages = chatToUse.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Stream the response
      let fullResponse = '';
      for await (const chunk of sendStreamingMessage(messages)) {
        fullResponse += chunk;
        
        // Update the AI message with the streaming content
        updateMessage(chatToUse.id, aiMessage.id, fullResponse, true);
      }

      // Mark streaming as complete
      updateMessage(chatToUse.id, aiMessage.id, fullResponse, false);

    } catch (error) {
      console.error('Error sending message:', error);
      handleApiError(error, 'Failed to send message');
      
      // Update AI message with error
      updateMessage(chatToUse.id, aiMessage.id, 'Sorry, I encountered an error. Please try again.', false);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {currentChat?.title || 'ChatGPT Clone'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {currentChat ? `${currentChat.messages.length} messages` : 'Start a new conversation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 scroll-smooth">
        <div className="max-w-4xl mx-auto min-h-full">
          {!currentChat || currentChat.messages.length === 0 ? (
            /* Welcome Message */
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to ChatGPT Clone
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                Start a conversation by typing a message below.
              </p>
              
              {/* Error state */}
              {hasError() && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 mb-3">
                    {getUserFriendlyMessage()}
                  </p>
                  <RetryButton 
                    onRetry={clearError}
                    size="sm"
                    variant="danger"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Ask anything</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Get help with coding, writing, analysis, and more.</p>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Creative tasks</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Brainstorm ideas, write stories, or solve problems.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-2 sm:space-y-4">
              {currentChat.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isTyping}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
