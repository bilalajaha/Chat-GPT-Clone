import { useChat } from '@/context/ChatContext';
import { useCallback } from 'react';
import { Chat, Message } from '@/types';
import { generateId, generateChatTitle } from '@/utils';

// Custom hook for chat-specific state management
export function useChatState() {
  const { state, dispatch } = useChat();

  // Chat management
  const createNewChat = useCallback((title?: string) => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: title || 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_CHAT', payload: newChat });
    return newChat;
  }, [dispatch]);

  const selectChat = useCallback((chat: Chat | null) => {
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat });
  }, [dispatch]);

  const deleteChat = useCallback((chatId: string) => {
    dispatch({ type: 'DELETE_CHAT', payload: chatId });
  }, [dispatch]);

  const renameChat = useCallback((chatId: string, title: string) => {
    dispatch({ type: 'RENAME_CHAT', payload: { chatId, title } });
  }, [dispatch]);

  const clearAllChats = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_CHATS' });
  }, [dispatch]);

  // Message management
  const addMessage = useCallback((chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: newMessage } });
    return newMessage;
  }, [dispatch]);

  const updateMessage = useCallback((chatId: string, messageId: string, content: string, isStreaming?: boolean) => {
    dispatch({ 
      type: 'UPDATE_MESSAGE', 
      payload: { chatId, messageId, content, isStreaming } 
    });
  }, [dispatch]);

  const deleteMessage = useCallback((chatId: string, messageId: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: { chatId, messageId } });
  }, [dispatch]);

  // Smart chat title generation
  const generateTitleFromFirstMessage = useCallback((chatId: string, firstMessage: string) => {
    const title = generateChatTitle(firstMessage);
    renameChat(chatId, title);
  }, [renameChat]);

  // Chat statistics
  const getChatStats = useCallback((chatId: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return null;

    return {
      messageCount: chat.messages.length,
      userMessages: chat.messages.filter(m => m.role === 'user').length,
      assistantMessages: chat.messages.filter(m => m.role === 'assistant').length,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      lastMessage: chat.messages[chat.messages.length - 1] || null,
    };
  }, [state.chats]);

  // Search and filter
  const searchChats = useCallback((query: string) => {
    return state.chats.filter(chat =>
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.messages.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [state.chats]);

  // Get recent chats
  const getRecentChats = useCallback((limit: number = 10) => {
    return state.chats
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }, [state.chats]);

  // Get chat by ID
  const getChatById = useCallback((chatId: string) => {
    return state.chats.find(chat => chat.id === chatId) || null;
  }, [state.chats]);

  // Check if chat exists
  const chatExists = useCallback((chatId: string) => {
    return state.chats.some(chat => chat.id === chatId);
  }, [state.chats]);

  // Get total message count across all chats
  const getTotalMessageCount = useCallback(() => {
    return state.chats.reduce((total, chat) => total + chat.messages.length, 0);
  }, [state.chats]);

  // Get total token count (estimated)
  const getTotalTokenCount = useCallback(() => {
    return state.chats.reduce((total, chat) => {
      return total + chat.messages.reduce((chatTotal, msg) => {
        // Rough estimation: 1 token ≈ 4 characters
        return chatTotal + Math.ceil(msg.content.length / 4);
      }, 0);
    }, 0);
  }, [state.chats]);

  return {
    // State
    chats: state.chats,
    currentChat: state.currentChat,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    
    // Chat management
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    clearAllChats,
    
    // Message management
    addMessage,
    updateMessage,
    deleteMessage,
    generateTitleFromFirstMessage,
    
    // Utilities
    getChatStats,
    searchChats,
    getRecentChats,
    getChatById,
    chatExists,
    getTotalMessageCount,
    getTotalTokenCount,
  };
}
