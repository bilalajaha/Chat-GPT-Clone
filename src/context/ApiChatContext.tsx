'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface ApiChatContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ApiChatContext = createContext<ApiChatContextType | undefined>(undefined);

export function ApiChatProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const token = apiClient.getToken();
    if (token) {
      setIsAuthenticated(true);
      // Optionally fetch user data
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.login(email, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.register(name, email, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApiChatContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </ApiChatContext.Provider>
  );
}

export function useApiChat() {
  const context = useContext(ApiChatContext);
  if (context === undefined) {
    throw new Error('useApiChat must be used within an ApiChatProvider');
  }
  return context;
}