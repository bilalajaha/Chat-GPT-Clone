'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Chat, Message, AppState, LoadingState, ErrorState, UserPreferences, AppSettings, ChatStats } from '@/types';
import { generateId, storage } from '@/utils';

// Initial state
const initialState: AppState = {
  chats: [],
  currentChat: null,
  loading: {
    global: false,
    chat: false,
    message: false,
    api: false,
  },
  error: {
    message: null,
    type: null,
    timestamp: null,
    retryable: false,
  },
  theme: { mode: 'light' },
  preferences: {
    theme: 'light',
    autoSave: true,
    soundEnabled: true,
    animationsEnabled: true,
    defaultModel: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1000,
  },
  settings: {
    apiKey: null,
    selectedModel: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1000,
    enableStreaming: true,
    autoSave: true,
  },
  stats: {
    totalMessages: 0,
    totalChats: 0,
    totalTokens: 0,
    averageResponseTime: 0,
    lastActivity: null,
  },
  ui: {
    sidebarOpen: true,
    searchQuery: '',
    selectedChatId: null,
    editingChatId: null,
    showSettings: false,
    showAbout: false,
  },
};

// Action types
type ChatAction =
  // Loading actions
  | { type: 'SET_LOADING'; payload: { type: keyof LoadingState; value: boolean } }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  
  // Error actions
  | { type: 'SET_ERROR'; payload: ErrorState }
  | { type: 'CLEAR_ERROR' }
  
  // Chat actions
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; content: string; isStreaming?: boolean } }
  | { type: 'DELETE_MESSAGE'; payload: { chatId: string; messageId: string } }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'RENAME_CHAT'; payload: { chatId: string; title: string } }
  | { type: 'LOAD_CHATS'; payload: Chat[] }
  | { type: 'CLEAR_ALL_CHATS' }
  
  // Theme actions
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_THEME' }
  
  // Preferences actions
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_PREFERENCES' }
  
  // Settings actions
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESET_SETTINGS' }
  
  // Stats actions
  | { type: 'UPDATE_STATS'; payload: Partial<ChatStats> }
  | { type: 'RESET_STATS' }
  
  // UI actions
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CHAT_ID'; payload: string | null }
  | { type: 'SET_EDITING_CHAT_ID'; payload: string | null }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_SHOW_ABOUT'; payload: boolean }
  | { type: 'RESET_UI' };

// Reducer
function chatReducer(state: AppState, action: ChatAction): AppState {
  switch (action.type) {
    // Loading actions
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value,
        },
      };
    
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload,
        },
      };
    
    // Error actions
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: {
          message: null,
          type: null,
          timestamp: null,
          retryable: false,
        },
      };
    
    // Chat actions
    case 'ADD_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        currentChat: action.payload,
        stats: {
          ...state.stats,
          totalChats: state.stats.totalChats + 1,
          lastActivity: new Date(),
        },
      };
    
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChat: action.payload,
        ui: {
          ...state.ui,
          selectedChatId: action.payload?.id || null,
        },
      };
    
    case 'ADD_MESSAGE':
      const updatedChats = state.chats.map(chat =>
        chat.id === action.payload.chatId
          ? {
              ...chat,
              messages: [...chat.messages, action.payload.message],
              updatedAt: new Date(),
            }
          : chat
      );
      
      return {
        ...state,
        chats: updatedChats,
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: [...state.currentChat.messages, action.payload.message],
              updatedAt: new Date(),
            }
          : state.currentChat,
        stats: {
          ...state.stats,
          totalMessages: state.stats.totalMessages + 1,
          lastActivity: new Date(),
        },
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
                    ? { 
                        ...msg, 
                        content: action.payload.content,
                        isStreaming: action.payload.isStreaming ?? msg.isStreaming,
                      }
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
                  ? { 
                      ...msg, 
                      content: action.payload.content,
                      isStreaming: action.payload.isStreaming ?? msg.isStreaming,
                    }
                  : msg
              ),
            }
          : state.currentChat,
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                messages: chat.messages.filter(msg => msg.id !== action.payload.messageId),
              }
            : chat
        ),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.filter(msg => msg.id !== action.payload.messageId),
            }
          : state.currentChat,
      };
    
    case 'DELETE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        currentChat: state.currentChat?.id === action.payload ? null : state.currentChat,
        stats: {
          ...state.stats,
          totalChats: Math.max(0, state.stats.totalChats - 1),
        },
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
    
    case 'LOAD_CHATS':
      return { 
        ...state, 
        chats: action.payload,
        stats: {
          ...state.stats,
          totalChats: action.payload.length,
          totalMessages: action.payload.reduce((acc, chat) => acc + chat.messages.length, 0),
        },
      };
    
    case 'CLEAR_ALL_CHATS':
      return {
        ...state,
        chats: [],
        currentChat: null,
        stats: {
          ...state.stats,
          totalChats: 0,
          totalMessages: 0,
        },
      };
    
    // Theme actions
    case 'SET_THEME':
      return { 
        ...state, 
        theme: { mode: action.payload },
        preferences: {
          ...state.preferences,
          theme: action.payload,
        },
      };
    
    case 'TOGGLE_THEME':
      const newTheme = state.theme.mode === 'light' ? 'dark' : 'light';
      return {
        ...state,
        theme: { mode: newTheme },
        preferences: {
          ...state.preferences,
          theme: newTheme,
        },
      };
    
    // Preferences actions
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    
    case 'RESET_PREFERENCES':
      return {
        ...state,
        preferences: initialState.preferences,
      };
    
    // Settings actions
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    
    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: initialState.settings,
      };
    
    // Stats actions
    case 'UPDATE_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload,
        },
      };
    
    case 'RESET_STATS':
      return {
        ...state,
        stats: initialState.stats,
      };
    
    // UI actions
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: action.payload,
        },
      };
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        ui: {
          ...state.ui,
          searchQuery: action.payload,
        },
      };
    
    case 'SET_SELECTED_CHAT_ID':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedChatId: action.payload,
        },
      };
    
    case 'SET_EDITING_CHAT_ID':
      return {
        ...state,
        ui: {
          ...state.ui,
          editingChatId: action.payload,
        },
      };
    
    case 'SET_SHOW_SETTINGS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showSettings: action.payload,
        },
      };
    
    case 'SET_SHOW_ABOUT':
      return {
        ...state,
        ui: {
          ...state.ui,
          showAbout: action.payload,
        },
      };
    
    case 'RESET_UI':
      return {
        ...state,
        ui: initialState.ui,
      };
    
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

  // Load data from localStorage on mount
  useEffect(() => {
    // Load chats
    const savedChats = storage.get('chats');
    if (savedChats && Array.isArray(savedChats)) {
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

    // Load preferences
    const savedPreferences = storage.get('preferences');
    if (savedPreferences) {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: savedPreferences });
    }

    // Load settings
    const savedSettings = storage.get('settings');
    if (savedSettings) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: savedSettings });
    }

    // Load UI state
    const savedUI = storage.get('ui');
    if (savedUI) {
      // Only restore non-sensitive UI state
      const { showSettings, showAbout, ...restUI } = savedUI;
      Object.entries(restUI).forEach(([key, value]) => {
        dispatch({ type: `SET_${key.toUpperCase()}` as any, payload: value });
      });
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (state.chats.length > 0) {
      storage.set('chats', state.chats);
    }
  }, [state.chats]);

  // Save preferences to localStorage
  useEffect(() => {
    storage.set('preferences', state.preferences);
  }, [state.preferences]);

  // Save settings to localStorage
  useEffect(() => {
    storage.set('settings', state.settings);
  }, [state.settings]);

  // Save UI state to localStorage (excluding sensitive states)
  useEffect(() => {
    const { showSettings, showAbout, ...uiToSave } = state.ui;
    storage.set('ui', uiToSave);
  }, [state.ui]);

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
