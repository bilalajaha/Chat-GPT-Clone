'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Bot, Send, Plus, MoreVertical, Settings, Moon, Sun } from 'lucide-react';
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

interface ModernChatInterfaceProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export default function ModernChatInterface({ sidebarOpen, onToggleSidebar, isMobile }: ModernChatInterfaceProps) {
  const { currentChat, addMessage, updateMessage, generateTitleFromFirstMessage, createNewChat } = useChatState();
  const { handleApiError, clearError, hasError, getUserFriendlyMessage } = useErrorHandler();
  const { setLoading } = useAppState();
  const { sendStreamingMessage, isLoading, error } = useChatAPI();
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
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
      // Prepare messages for API call (include all existing messages plus the new user message)
      const messages = [
        ...chatToUse.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: messageContent.trim()
        }
      ];

      // Debug: Log the messages being sent
      console.log('Sending messages to API:', messages);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      handleApiError(error, 'Failed to send message');
      
      // Update AI message with more specific error
      updateMessage(chatToUse.id, aiMessage.id, `Sorry, I encountered an error: ${errorMessage}. Please try again.`, false);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 dark:bg-gray-900">
      {/* Modern Header */}
      <div className="p-4 border-b border-gray-800 dark:border-gray-700 bg-gray-900 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {currentChat?.title || 'ChatGPT Clone'}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentChat ? `${currentChat.messages.length} messages` : 'Start a new conversation'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button className="p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth bg-gray-900 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto min-h-full">
          {!currentChat || currentChat.messages.length === 0 ? (
            /* Welcome Message */
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Welcome to ChatGPT Clone
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start a conversation by typing a message below. I can help you with coding, writing, analysis, and much more.
              </p>
              
              {/* Error state */}
              {hasError() && (
                <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-xl max-w-md mx-auto">
                  <p className="text-red-400 mb-3">
                    {getUserFriendlyMessage()}
                  </p>
                  <RetryButton 
                    onRetry={clearError}
                    size="sm"
                    variant="danger"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="font-semibold text-white mb-2">Ask anything</h4>
                  <p className="text-sm text-gray-400">Get help with coding, writing, analysis, and more.</p>
                </div>
                <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="font-semibold text-white mb-2">Creative tasks</h4>
                  <p className="text-sm text-gray-400">Brainstorm ideas, write stories, or solve problems.</p>
                </div>
                <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="font-semibold text-white mb-2">Code assistance</h4>
                  <p className="text-sm text-gray-400">Debug, optimize, or explain code in any language.</p>
                </div>
                <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="font-semibold text-white mb-2">Learning</h4>
                  <p className="text-sm text-gray-400">Learn new concepts, get explanations, and ask questions.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6 p-4">
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
      <div className="p-4 border-t border-gray-800 dark:border-gray-700 bg-gray-900 dark:bg-gray-900">
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
