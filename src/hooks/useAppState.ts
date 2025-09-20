import { useChat } from '@/context/ChatContext';
import { useCallback } from 'react';

// Custom hook for app state management
export function useAppState() {
  const { state, dispatch } = useChat();

  // Loading state helpers
  const setLoading = useCallback((type: keyof typeof state.loading, value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { type, value } });
  }, [dispatch]);

  const setGlobalLoading = useCallback((value: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: value });
  }, [dispatch]);

  // Error state helpers
  const setError = useCallback((error: { message: string; type: 'api' | 'network' | 'validation' | 'storage'; retryable?: boolean }) => {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        message: error.message,
        type: error.type,
        timestamp: new Date(),
        retryable: error.retryable ?? false,
      },
    });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  // Theme helpers
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, [dispatch]);

  // Preferences helpers
  const updatePreferences = useCallback((preferences: Partial<typeof state.preferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, [dispatch]);

  const resetPreferences = useCallback(() => {
    dispatch({ type: 'RESET_PREFERENCES' });
  }, [dispatch]);

  // Settings helpers
  const updateSettings = useCallback((settings: Partial<typeof state.settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [dispatch]);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
  }, [dispatch]);

  // Stats helpers
  const updateStats = useCallback((stats: Partial<typeof state.stats>) => {
    dispatch({ type: 'UPDATE_STATS', payload: stats });
  }, [dispatch]);

  const resetStats = useCallback(() => {
    dispatch({ type: 'RESET_STATS' });
  }, [dispatch]);

  // UI helpers
  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, [dispatch]);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const setSelectedChatId = useCallback((chatId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CHAT_ID', payload: chatId });
  }, [dispatch]);

  const setEditingChatId = useCallback((chatId: string | null) => {
    dispatch({ type: 'SET_EDITING_CHAT_ID', payload: chatId });
  }, [dispatch]);

  const setShowSettings = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_SETTINGS', payload: show });
  }, [dispatch]);

  const setShowAbout = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_ABOUT', payload: show });
  }, [dispatch]);

  const resetUI = useCallback(() => {
    dispatch({ type: 'RESET_UI' });
  }, [dispatch]);

  return {
    state,
    dispatch,
    // Loading
    setLoading,
    setGlobalLoading,
    // Error
    setError,
    clearError,
    // Theme
    setTheme,
    toggleTheme,
    // Preferences
    updatePreferences,
    resetPreferences,
    // Settings
    updateSettings,
    resetSettings,
    // Stats
    updateStats,
    resetStats,
    // UI
    setSidebarOpen,
    setSearchQuery,
    setSelectedChatId,
    setEditingChatId,
    setShowSettings,
    setShowAbout,
    resetUI,
  };
}
