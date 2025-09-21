'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { Chat, Message, AppState, LoadingState, ErrorState, UserPreferences, AppSettings, ChatStats } from '@/types';
import { apiClient, ApiError } from '@/lib/api';
import { migrationService } from '@/lib/migration';

// Extended state for API integration
interface ApiAppState extends AppState {
  user: any | null;
  isAuthenticated: boolean;
  migrationStatus: {
    isComplete: boolean;
    isMigrating: boolean;
    hasLocalData: boolean;
  };
}

// Initial state
const initialState: ApiAppState = {
  chats: [],
  currentChat: null,
  user: null,
  isAuthenticated: false,
  migrationStatus: {
    isComplete: true,
    isMigrating: false,
    hasLocalData: false,
  },
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
type ApiChatAction =
  // Loading actions
  | { type: 'SET_LOADING'; payload: { type: keyof LoadingState; value: boolean } }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  
  // Error actions
  | { type: 'SET_ERROR'; payload: ErrorState }
  | { type: 'CLEAR_ERROR' }
  
  // Authentication actions
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' }
  
  // Migration actions
  | { type: 'SET_MIGRATION_STATUS'; payload: any }
  | { type: 'SET_MIGRATION_COMPLETE' }
  
  // Chat actions
  | { type: 'LOAD_CHATS'; payload: Chat[] }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'UPDATE_CHAT'; payload: Chat }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  
  // Message actions
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; message: Message } }
  | { type: 'DELETE_MESSAGE'; payload: { chatId: string; messageId: string } }
  
  // Preferences and settings
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  
  // UI actions
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CHAT_ID'; payload: string | null }
  | { type: 'SET_EDITING_CHAT_ID'; payload: string | null }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_SHOW_ABOUT'; payload: boolean };

// Reducer
function apiChatReducer(state: ApiAppState, action: ApiChatAction): ApiAppState {
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
    
    // Authentication actions
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        chats: [],
        currentChat: null,
      };
    
    // Migration actions
    case 'SET_MIGRATION_STATUS':
      return {
        ...state,
        migrationStatus: action.payload,
      };
    
    case 'SET_MIGRATION_COMPLETE':
      return {
        ...state,
        migrationStatus: {
          ...state.migrationStatus,
          isComplete: true,
          isMigrating: false,
        },
      };
    
    // Chat actions
    case 'LOAD_CHATS':
      return {
        ...state,
        chats: action.payload,
        stats: {
          ...state.stats,
          totalChats: action.payload.length,
        },
      };
    
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
    
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.id ? action.payload : chat
        ),
        currentChat: state.currentChat?.id === action.payload.id ? action.payload : state.currentChat,
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
    
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChat: action.payload,
        ui: {
          ...state.ui,
          selectedChatId: action.payload?.id || null,
        },
      };
    
    // Message actions
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
                  msg.id === action.payload.messageId ? action.payload.message : msg
                ),
              }
            : chat
        ),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.map(msg =>
                msg.id === action.payload.messageId ? action.payload.message : msg
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
        stats: {
          ...state.stats,
          totalMessages: Math.max(0, state.stats.totalMessages - 1),
        },
      };
    
    // Preferences and settings
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
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
    
    default:
      return state;
  }
}

// Context
const ApiChatContext = createContext<{
  state: ApiAppState;
  dispatch: React.Dispatch<ApiChatAction>;
  // API methods
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createChat: (title?: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateChat: (id: string, data: any) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  migrateData: () => Promise<void>;
  loadChats: () => Promise<void>;
  loadUserData: () => Promise<void>;
} | null>(null);

// Provider
export function ApiChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(apiChatReducer, initialState);

  // Initialize authentication and migration status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_GLOBAL_LOADING', payload: true });
        
        // Check authentication
        const isAuthenticated = await migrationService.checkAuthentication();
        dispatch({ type: 'SET_AUTHENTICATED', payload: isAuthenticated });
        
        if (isAuthenticated) {
          // Load user data
          await loadUserData();
          
          // Check migration status
          const migrationStatus = migrationService.getMigrationStatus();
          dispatch({ type: 'SET_MIGRATION_STATUS', payload: migrationStatus });
          
          // Auto-migrate if needed
          if (migrationStatus.hasLocalData && !migrationStatus.isComplete) {
            await migrateData();
          }
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: {
            message: error instanceof Error ? error.message : 'Failed to initialize app',
            type: 'api',
            timestamp: new Date(),
            retryable: true,
          },
        });
      } finally {
        dispatch({ type: 'SET_GLOBAL_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // API methods
  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: true } });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.login({ email, password });
      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      
      // Load user data after login
      await loadUserData();
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Login failed',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: false } });
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: true } });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.register({
        name,
        email,
        password,
        password_confirmation: password,
      });
      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      
      // Load user data after registration
      await loadUserData();
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Registration failed',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: false } });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout fails on server, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const createChat = useCallback(async (title?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'chat', value: true } });
      
      const chatData = await apiClient.createChat({
        title: title || 'New Chat',
      });
      
      // Transform backend chat to frontend format
      const frontendChat: Chat = {
        id: chatData.id.toString(),
        title: chatData.title,
        messages: [],
        createdAt: new Date(chatData.created_at),
        updatedAt: new Date(chatData.updated_at),
      };
      
      dispatch({ type: 'ADD_CHAT', payload: frontendChat });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to create chat',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'chat', value: false } });
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!state.currentChat) {
      throw new Error('No active chat');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'message', value: true } });
      
      const response = await apiClient.sendMessage(state.currentChat.id, {
        content,
        model: state.settings.selectedModel,
        temperature: state.settings.temperature,
        max_tokens: state.settings.maxTokens,
      });
      
      // Transform backend messages to frontend format
      const userMessage: Message = {
        id: response.user_message.id.toString(),
        content: response.user_message.content,
        role: 'user',
        timestamp: new Date(response.user_message.created_at),
      };
      
      const aiMessage: Message = {
        id: response.ai_response.id.toString(),
        content: response.ai_response.content,
        role: 'assistant',
        timestamp: new Date(response.ai_response.created_at),
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: state.currentChat.id, message: userMessage } });
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: state.currentChat.id, message: aiMessage } });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to send message',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'message', value: false } });
    }
  }, [state.currentChat, state.settings]);

  const updateChat = useCallback(async (id: string, data: any) => {
    try {
      const updatedChat = await apiClient.updateChat(id, data);
      
      // Transform backend chat to frontend format
      const frontendChat: Chat = {
        id: updatedChat.id.toString(),
        title: updatedChat.title,
        messages: state.chats.find(c => c.id === id)?.messages || [],
        createdAt: new Date(updatedChat.created_at),
        updatedAt: new Date(updatedChat.updated_at),
      };
      
      dispatch({ type: 'UPDATE_CHAT', payload: frontendChat });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to update chat',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    }
  }, [state.chats]);

  const deleteChat = useCallback(async (id: string) => {
    try {
      await apiClient.deleteChat(id);
      dispatch({ type: 'DELETE_CHAT', payload: id });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to delete chat',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
      throw error;
    }
  }, []);

  const migrateData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: true } });
      
      const result = await migrationService.migrateToBackend();
      
      if (result.success) {
        dispatch({ type: 'SET_MIGRATION_COMPLETE' });
        // Clear localStorage after successful migration
        migrationService.clearLocalStorageData();
        // Reload chats from backend
        await loadChats();
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: {
            message: `Migration failed: ${result.errors.join(', ')}`,
            type: 'api',
            timestamp: new Date(),
            retryable: true,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof Error ? error.message : 'Migration failed',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'api', value: false } });
    }
  }, []);

  const loadChats = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'chat', value: true } });
      
      const response = await apiClient.getChats();
      
      // Transform backend chats to frontend format
      const frontendChats: Chat[] = response.data.map((chat: any) => ({
        id: chat.id.toString(),
        title: chat.title,
        messages: chat.messages?.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
        })) || [],
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at),
      }));
      
      dispatch({ type: 'LOAD_CHATS', payload: frontendChats });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to load chats',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { type: 'chat', value: false } });
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const [userProfile, preferences, statistics] = await Promise.all([
        apiClient.getCurrentUser(),
        apiClient.getUserPreferences(),
        apiClient.getUserStatistics(),
      ]);
      
      dispatch({ type: 'SET_USER', payload: userProfile.user });
      
      if (preferences) {
        dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: {
            theme: preferences.theme,
            autoSave: preferences.auto_save,
            defaultModel: preferences.default_model,
            temperature: preferences.temperature,
            maxTokens: preferences.max_tokens,
          },
        });
      }
      
      if (statistics) {
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            // Update stats in the state
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: error instanceof ApiError ? error.message : 'Failed to load user data',
          type: 'api',
          timestamp: new Date(),
          retryable: true,
        },
      });
    }
  }, []);

  return (
    <ApiChatContext.Provider
      value={{
        state,
        dispatch,
        login,
        register,
        logout,
        createChat,
        sendMessage,
        updateChat,
        deleteChat,
        migrateData,
        loadChats,
        loadUserData,
      }}
    >
      {children}
    </ApiChatContext.Provider>
  );
}

// Hook
export function useApiChat() {
  const context = useContext(ApiChatContext);
  if (!context) {
    throw new Error('useApiChat must be used within an ApiChatProvider');
  }
  return context;
}
