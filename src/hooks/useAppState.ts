'use client';

import { useState, useEffect } from 'react';

interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
  loading: {
    global: boolean;
  };
  ui: {
    searchQuery: string;
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    theme: 'light',
    sidebarOpen: true,
    isLoading: false,
    error: null,
    loading: {
      global: false,
    },
    ui: {
      searchQuery: '',
      },
    });

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  };

  const setSearchQuery = (searchQuery: string) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        searchQuery,
      },
    }));
  };

  const clearError = () => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  };

  const setGlobalLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        global: loading,
      },
    }));
  };

  return {
    state,
    toggleTheme,
    toggleSidebar,
    setLoading,
    setError,
    setSearchQuery,
    clearError,
    setGlobalLoading,
  };
}