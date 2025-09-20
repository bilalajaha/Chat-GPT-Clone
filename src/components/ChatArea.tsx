'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Bot } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useChatAPI } from '@/hooks/useChatAPI';
import { Message } from '@/types';
import { generateChatTitle } from '@/utils';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

interface ChatAreaProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export default function ChatArea({ sidebarOpen, onToggleSidebar, isMobile }: ChatAreaProps) {
  const { state, dispatch } = useChat();
  const { sendStreamingMessage, isLoading, error } = useChatAPI();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.currentChat?.messages]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error });
    }
  }, [error, dispatch]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !state.currentChat) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    // Add user message
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { chatId: state.currentChat.id, message: userMessage } 
    });

    // Generate chat title if this is the first message
    if (state.currentChat.messages.length === 0) {
      const title = generateChatTitle(messageContent.trim());
      dispatch({ 
        type: 'RENAME_CHAT', 
        payload: { chatId: state.currentChat.id, title } 
      });
    }

    // Create AI message placeholder for streaming
    const aiMessageId = `msg-${Date.now() + 1}`;
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    };

    // Add AI message placeholder
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { chatId: state.currentChat.id, message: aiMessage } 
    });

    setIsTyping(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Prepare messages for API call
      const messages = [
        ...state.currentChat.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        { role: 'user' as const, content: messageContent.trim() }
      ];

      // Stream the response
      let fullResponse = '';
      for await (const chunk of sendStreamingMessage(messages)) {
        fullResponse += chunk;
        
        // Update the AI message with the streaming content
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            chatId: state.currentChat.id,
            messageId: aiMessageId,
            content: fullResponse,
          },
        });
      }

      // Mark streaming as complete
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: state.currentChat.id,
          messageId: aiMessageId,
          content: fullResponse,
        },
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update AI message with error
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: state.currentChat.id,
          messageId: aiMessageId,
          content: 'Sorry, I encountered an error. Please try again.',
        },
      });
    } finally {
      setIsTyping(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const currentChat = state.currentChat;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentChat?.title || 'ChatGPT Clone'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentChat ? `${currentChat.messages.length} messages` : 'Start a new conversation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {!currentChat || currentChat.messages.length === 0 ? (
            /* Welcome Message */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to ChatGPT Clone
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start a conversation by typing a message below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Ask anything</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get help with coding, writing, analysis, and more.</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Creative tasks</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brainstorm ideas, write stories, or solve problems.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-4">
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isTyping}
            disabled={!currentChat}
          />
        </div>
      </div>
    </div>
  );
}
