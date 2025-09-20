'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Chat, Message, AppState } from '@/types';
import { generateId, storage } from '@/utils';

// Initial state
const initialState: AppState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  error: null,
  theme: { mode: 'light' },
};

// Action types
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; content: string } }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'RENAME_CHAT'; payload: { chatId: string; title: string } }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'LOAD_CHATS'; payload: Chat[] };

// Reducer
function chatReducer(state: AppState, action: ChatAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        currentChat: action.payload,
      };
    
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: [...chat.messages, action.payload.message],
                updatedAt: new Date(),
              }
            : chat
        ),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: [...state.currentChat.messages, action.payload.message],
              updatedAt: new Date(),
            }
          : state.currentChat,
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { ...msg, content: action.payload.content }
                    : msg
                ),
              }
            : chat
        ),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.map(msg =>
                msg.id === action.payload.messageId
                  ? { ...msg, content: action.payload.content }
                  : msg
              ),
            }
          : state.currentChat,
      };
    
    case 'DELETE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        currentChat: state.currentChat?.id === action.payload ? null : state.currentChat,
      };
    
    case 'RENAME_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? { ...chat, title: action.payload.title }
            : chat
        ),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? { ...state.currentChat, title: action.payload.title }
          : state.currentChat,
      };
    
    case 'SET_THEME':
      return { ...state, theme: { mode: action.payload } };
    
    case 'LOAD_CHATS':
      return { ...state, chats: action.payload };
    
    default:
      return state;
  }
}

// Context
const ChatContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<ChatAction>;
} | null>(null);

// Provider
export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = storage.get('chats');
    if (savedChats && Array.isArray(savedChats)) {
      // Convert date strings back to Date objects
      const chats = savedChats.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      dispatch({ type: 'LOAD_CHATS', payload: chats });
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (state.chats.length > 0) {
      storage.set('chats', state.chats);
    }
  }, [state.chats]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
